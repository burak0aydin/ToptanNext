import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, ProductListingStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertProductReviewDto } from './dto/upsert-product-review.dto';

@Injectable()
export class ProductReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductReviews(productListingId: string) {
    const [summary, reviews] = await Promise.all([
      this.prisma.productReview.aggregate({
        where: {
          productListingId,
        },
        _count: {
          _all: true,
        },
        _avg: {
          rating: true,
        },
      }),
      this.prisma.productReview.findMany({
        where: {
          productListingId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    return {
      summary: {
        count: summary._count._all,
        averageRating: summary._avg.rating ?? 0,
      },
      items: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        buyerName: this.maskBuyerName(
          review.buyer.firstName,
          review.buyer.lastName,
          review.buyer.fullName,
        ),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
  }

  async getMyReviewState(userId: string, role: Role, productListingId: string) {
    const [listing, hasPurchased, myReview] = await Promise.all([
      this.prisma.productListing.findUnique({
        where: {
          id: productListingId,
        },
        select: {
          id: true,
          supplierId: true,
        },
      }),
      this.hasPurchasedProduct(userId, productListingId),
      this.prisma.productReview.findUnique({
        where: {
          productListingId_buyerId: {
            productListingId,
            buyerId: userId,
          },
        },
      }),
    ]);

    if (!listing) {
      throw new NotFoundException('Ürün bulunamadı.');
    }

    const reason = this.resolveReviewBlockReason(role, listing.supplierId, userId, hasPurchased);

    return {
      canReview: reason === null,
      reason,
      myReview: myReview
        ? {
            id: myReview.id,
            rating: myReview.rating,
            comment: myReview.comment,
            createdAt: myReview.createdAt,
            updatedAt: myReview.updatedAt,
          }
        : null,
    };
  }

  async upsertReview(
    userId: string,
    role: Role,
    productListingId: string,
    dto: UpsertProductReviewDto,
  ) {
    const listing = await this.prisma.productListing.findUnique({
      where: {
        id: productListingId,
      },
      select: {
        id: true,
        supplierId: true,
        status: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (
      !listing ||
      listing.deletedAt ||
      listing.status !== ProductListingStatus.APPROVED ||
      !listing.isActive
    ) {
      throw new NotFoundException('Ürün bulunamadı.');
    }

    const hasPurchased = await this.hasPurchasedProduct(userId, productListingId);
    const reason = this.resolveReviewBlockReason(role, listing.supplierId, userId, hasPurchased);
    if (reason) {
      throw new ForbiddenException(reason);
    }

    const rating = Math.max(1, Math.min(5, Math.floor(dto.rating)));
    const comment = dto.comment?.trim() || null;

    const review = await this.prisma.productReview.upsert({
      where: {
        productListingId_buyerId: {
          productListingId,
          buyerId: userId,
        },
      },
      create: {
        productListingId,
        buyerId: userId,
        rating,
        comment,
      },
      update: {
        rating,
        comment,
      },
    });

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private async hasPurchasedProduct(userId: string, productListingId: string): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: {
        buyerId: userId,
        productListingId,
        order: {
          status: OrderStatus.PAID,
        },
      },
    });

    return count > 0;
  }

  private resolveReviewBlockReason(
    role: Role,
    supplierId: string,
    userId: string,
    hasPurchased: boolean,
  ): string | null {
    if (role !== Role.BUYER) {
      return 'Değerlendirme yapmak için alıcı hesabı gereklidir.';
    }

    if (supplierId === userId) {
      return 'Kendi ürününüzü değerlendiremezsiniz.';
    }

    if (!hasPurchased) {
      return 'Bu ürünü değerlendirmek için önce ürünü sipariş etmiş olmalısınız.';
    }

    return null;
  }

  private maskBuyerName(firstName?: string | null, lastName?: string | null, fullName?: string | null): string {
    const source = [firstName, lastName].filter(Boolean).join(' ').trim() || fullName?.trim() || 'Alıcı';
    return source
      .split(/\s+/)
      .map((part) => `${part.charAt(0).toLocaleUpperCase('tr-TR')}***`)
      .join(' ');
  }
}
