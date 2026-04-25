import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductListingStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const cartItemSelect = {
  id: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
  productListing: {
    select: {
      id: true,
      supplierId: true,
      name: true,
      slug: true,
      basePrice: true,
      pricingTiers: true,
      currency: true,
      minOrderQuantity: true,
      stock: true,
      media: {
        select: {
          id: true,
        },
        where: {
          mediaType: 'IMAGE',
        },
        orderBy: {
          displayOrder: 'asc',
        },
        take: 1,
      },
      supplier: {
        select: {
          supplierApplication: {
            select: {
              companyName: true,
            },
          },
          fullName: true,
        },
      },
    },
  },
} as const;

type CartItemRecord = Prisma.CartItemGetPayload<{
  select: typeof cartItemSelect;
}>;

type CartSummary = {
  items: Array<{
    id: string;
    productListingId: string;
    supplierId: string;
    productName: string;
    productSlug: string;
    supplierName: string | null;
    quantity: number;
    minOrderQuantity: number | null;
    stock: number | null;
    unitPrice: string | null;
    currency: string;
    imageMediaId: string | null;
    lineTotal: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  totalItems: number;
  subtotal: string | null;
  currency: string;
};

type PricingTierRecord = {
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CartSummary> {
    const items = await this.prisma.cartItem.findMany({
      where: {
        buyerId: userId,
      },
      select: cartItemSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return this.buildSummary(items);
  }

  async addItem(
    userId: string,
    role: Role,
    dto: AddCartItemDto,
  ): Promise<CartSummary> {
    if (role !== Role.BUYER) {
      throw new ForbiddenException('Sepete eklemek için alıcı hesabı gereklidir.');
    }

    const listing = await this.prisma.productListing.findUnique({
      where: {
        id: dto.productListingId,
      },
      select: {
        id: true,
        supplierId: true,
        status: true,
        isActive: true,
        deletedAt: true,
        minOrderQuantity: true,
        stock: true,
      },
    });

    if (!listing || listing.deletedAt || listing.status !== ProductListingStatus.APPROVED || !listing.isActive) {
      throw new NotFoundException('Sepete eklenmek istenen ürün bulunamadı.');
    }

    if (listing.supplierId === userId) {
      throw new BadRequestException('Kendi ürününüzü sepete ekleyemezsiniz.');
    }

    const requestedQuantity = Math.max(dto.quantity ?? listing.minOrderQuantity ?? 1, 1);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        buyerId_productListingId: {
          buyerId: userId,
          productListingId: dto.productListingId,
        },
      },
      select: {
        quantity: true,
      },
    });

    const nextQuantity = requestedQuantity + (existingItem?.quantity ?? 0);

    if (listing.stock !== null && nextQuantity > listing.stock) {
      throw new BadRequestException('Sepete eklenen adet mevcut stoktan fazla olamaz.');
    }

    await this.prisma.cartItem.upsert({
      where: {
        buyerId_productListingId: {
          buyerId: userId,
          productListingId: dto.productListingId,
        },
      },
      create: {
        buyerId: userId,
        productListingId: dto.productListingId,
        quantity: nextQuantity,
      },
      update: {
        quantity: nextQuantity,
      },
    });

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartSummary> {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },
      include: {
        productListing: {
          select: {
            stock: true,
          },
        },
      },
    });

    if (!existing || existing.buyerId !== userId) {
      throw new NotFoundException('Sepet kalemi bulunamadı.');
    }

    if (
      existing.productListing.stock !== null
      && dto.quantity > existing.productListing.stock
    ) {
      throw new BadRequestException('Sepet adedi mevcut stoktan fazla olamaz.');
    }

    await this.prisma.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity: dto.quantity,
      },
    });

    return this.getCart(userId);
  }

  async removeItem(
    userId: string,
    itemId: string,
  ): Promise<{ cart: CartSummary; removedItemId: string }> {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },
      select: {
        id: true,
        buyerId: true,
      },
    });

    if (!existing || existing.buyerId !== userId) {
      throw new NotFoundException('Sepet kalemi bulunamadı.');
    }

    await this.prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    return {
      cart: await this.getCart(userId),
      removedItemId: itemId,
    };
  }

  private buildSummary(items: CartItemRecord[]): CartSummary {
    const normalizedItems = items.map((item) => {
      const unitPrice = this.resolveUnitPrice(
        item.productListing.basePrice,
        item.productListing.pricingTiers,
        item.quantity,
      );
      const lineTotal = unitPrice
        ? unitPrice.mul(item.quantity)
        : null;

      return {
        id: item.id,
        productListingId: item.productListing.id,
        supplierId: item.productListing.supplierId,
        productName: item.productListing.name,
        productSlug: item.productListing.slug,
        supplierName:
          item.productListing.supplier.supplierApplication?.companyName
          ?? item.productListing.supplier.fullName
          ?? null,
        quantity: item.quantity,
        minOrderQuantity: item.productListing.minOrderQuantity,
        stock: item.productListing.stock,
        unitPrice: unitPrice?.toFixed(2) ?? null,
        currency: item.productListing.currency,
        imageMediaId: item.productListing.media[0]?.id ?? null,
        lineTotal: lineTotal?.toFixed(2) ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const subtotalValue = normalizedItems.reduce<Prisma.Decimal | null>((total, item) => {
      if (!item.lineTotal) {
        return total;
      }

      const lineTotal = new Prisma.Decimal(item.lineTotal);
      return total ? total.add(lineTotal) : lineTotal;
    }, null);

    return {
      items: normalizedItems,
      totalItems: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotalValue?.toFixed(2) ?? null,
      currency: normalizedItems[0]?.currency ?? 'TRY',
    };
  }

  private resolveUnitPrice(
    basePrice: Prisma.Decimal | null,
    pricingTiers: Prisma.JsonValue,
    quantity: number,
  ): Prisma.Decimal | null {
    const parsedPricingTiers = this.parsePricingTiers(pricingTiers);

    if (parsedPricingTiers.length === 0) {
      return basePrice;
    }

    const matchedTier = parsedPricingTiers.find((tier) => (
      quantity >= tier.minQuantity && quantity <= tier.maxQuantity
    ));

    if (matchedTier) {
      return new Prisma.Decimal(matchedTier.unitPrice);
    }

    const lastTier = parsedPricingTiers[parsedPricingTiers.length - 1];
    if (quantity > lastTier.maxQuantity) {
      return new Prisma.Decimal(lastTier.unitPrice);
    }

    return basePrice ?? new Prisma.Decimal(parsedPricingTiers[0].unitPrice);
  }

  private parsePricingTiers(value: Prisma.JsonValue): PricingTierRecord[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }

        const typedItem = item as Record<string, unknown>;
        const minQuantity = Number(typedItem.minQuantity);
        const maxQuantity = Number(typedItem.maxQuantity);
        const unitPrice = Number(typedItem.unitPrice);

        if (
          !Number.isFinite(minQuantity)
          || !Number.isFinite(maxQuantity)
          || !Number.isFinite(unitPrice)
        ) {
          return null;
        }

        return {
          minQuantity,
          maxQuantity,
          unitPrice,
        };
      })
      .filter((item): item is PricingTierRecord => item !== null)
      .sort((left, right) => left.minQuantity - right.minQuantity);
  }
}
