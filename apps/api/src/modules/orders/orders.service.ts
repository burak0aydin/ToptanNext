import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, ProductListingStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const cartForCheckoutSelect = {
  id: true,
  buyerId: true,
  quantity: true,
  quotedUnitPrice: true,
  quotedCurrency: true,
  productListing: {
    select: {
      id: true,
      supplierId: true,
      status: true,
      isActive: true,
      deletedAt: true,
      basePrice: true,
      pricingTiers: true,
      currency: true,
      stock: true,
    },
  },
} as const;

type CheckoutCartItem = Prisma.CartItemGetPayload<{
  select: typeof cartForCheckoutSelect;
}>;

type PricingTierRecord = {
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, role: Role) {
    if (role !== Role.BUYER) {
      throw new ForbiddenException('Sipariş oluşturmak için alıcı hesabı gereklidir.');
    }

    return this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: {
          buyerId: userId,
        },
        select: cartForCheckoutSelect,
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Sepetinizde sipariş oluşturulacak ürün yok.');
      }

      const orderItems = cartItems.map((item) => this.resolveOrderItem(item));
      const subtotal = orderItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
      const currency = orderItems[0]?.currency ?? 'TRY';

      const order = await tx.order.create({
        data: {
          buyerId: userId,
          status: OrderStatus.PAID,
          currency,
          subtotal,
          items: {
            createMany: {
              data: orderItems.map((item) => ({
                buyerId: userId,
                productListingId: item.productListingId,
                supplierId: item.supplierId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                currency: item.currency,
              })),
            },
          },
        },
        include: {
          items: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          buyerId: userId,
        },
      });

      return {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal.toString(),
        currency: order.currency,
        items: order.items.map((item) => ({
          id: item.id,
          productListingId: item.productListingId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          currency: item.currency,
        })),
        createdAt: order.createdAt,
      };
    });
  }

  private resolveOrderItem(item: CheckoutCartItem) {
    const listing = item.productListing;
    if (
      listing.deletedAt ||
      listing.status !== ProductListingStatus.APPROVED ||
      !listing.isActive
    ) {
      throw new BadRequestException('Sepetinizde yayında olmayan ürünler var.');
    }

    if (listing.stock !== null && item.quantity > listing.stock) {
      throw new BadRequestException('Sepetinizde stoktan fazla adet içeren ürünler var.');
    }

    const unitPrice = item.quotedUnitPrice
      ? Number(item.quotedUnitPrice)
      : this.resolveTierPrice(listing.pricingTiers, item.quantity) ?? Number(listing.basePrice ?? 0);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new BadRequestException('Sepetinizde fiyatı hesaplanamayan ürünler var.');
    }

    return {
      productListingId: listing.id,
      supplierId: listing.supplierId,
      quantity: item.quantity,
      unitPrice,
      currency: item.quotedCurrency ?? listing.currency,
    };
  }

  private resolveTierPrice(value: Prisma.JsonValue, quantity: number): number | null {
    if (!Array.isArray(value)) {
      return null;
    }

    const tiers = value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }

        const typedItem = item as Record<string, unknown>;
        const minQuantity = Number(typedItem.minQuantity);
        const maxQuantity =
          typedItem.maxQuantity === null || typedItem.maxQuantity === undefined
            ? null
            : Number(typedItem.maxQuantity);
        const unitPrice = Number(typedItem.unitPrice);

        if (!Number.isFinite(minQuantity) || !Number.isFinite(unitPrice)) {
          return null;
        }

        return {
          minQuantity,
          maxQuantity: Number.isFinite(maxQuantity) ? maxQuantity : null,
          unitPrice,
        };
      })
      .filter((tier): tier is PricingTierRecord => tier !== null)
      .sort((left, right) => left.minQuantity - right.minQuantity);

    const matchedTier = tiers.find(
      (tier) => quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity),
    );

    return matchedTier?.unitPrice ?? null;
  }
}
