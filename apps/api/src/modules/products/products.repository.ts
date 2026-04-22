import {
  Injectable,
} from '@nestjs/common';
import {
  Prisma,
  ProductListingDeliveryMethod,
  ProductListingMediaType,
  ProductListingPackageType,
  ProductListingShippingTime,
  ProductListingStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const HIDDEN_OTHER_CATEGORY_SLUG = 'diger-gizli-kategori';
const HIDDEN_OTHER_CATEGORY_ROOT_SLUG = 'diger-gizli-ana-kategori';
const HIDDEN_OTHER_CATEGORY_SUB_SLUG = 'diger-gizli-alt-kategori';
const HIDDEN_OTHER_SECTOR_SLUG = 'diger-gizli-sektor';

const productListingSelect = {
  id: true,
  supplierId: true,
  name: true,
  slug: true,
  sku: true,
  description: true,
  categoryId: true,
  category: {
    select: {
      name: true,
    },
  },
  status: true,
  isActive: true,
  featuredFeatures: true,
  isCustomizable: true,
  customizationNote: true,
  basePrice: true,
  currency: true,
  minOrderQuantity: true,
  stock: true,
  isNegotiationEnabled: true,
  negotiationThreshold: true,
  pricingTiers: true,
  packageType: true,
  leadTimeDays: true,
  shippingTime: true,
  deliveryMethods: true,
  dynamicFreightAgreement: true,
  packageLengthCm: true,
  packageWidthCm: true,
  packageHeightCm: true,
  packageWeightKg: true,
  submittedAt: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  sectors: {
    select: {
      sectorId: true,
      sector: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  media: {
    select: {
      id: true,
      mediaType: true,
      filePath: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      displayOrder: true,
      createdAt: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  },
} as const;

type ProductListingSelectRecord = Prisma.ProductListingGetPayload<{
  select: typeof productListingSelect;
}>;

export type CategorySummary = {
  id: string;
  name: string;
  level: number;
  isActive: boolean;
};

export type SectorSummary = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  sectorId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductListingMediaRecord = {
  id: string;
  mediaType: ProductListingMediaType;
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  displayOrder: number;
  createdAt: Date;
};

export type ProductListingSectorRecord = {
  sectorId: string;
  sectorName: string;
};

export type ProductListingPricingTierRecord = {
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
};

export type ProductListingRecord = {
  id: string;
  supplierId: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: ProductListingStatus;
  isActive: boolean;
  featuredFeatures: string[];
  isCustomizable: boolean;
  customizationNote: string | null;
  basePrice: Prisma.Decimal | null;
  currency: string;
  minOrderQuantity: number | null;
  stock: number | null;
  isNegotiationEnabled: boolean;
  negotiationThreshold: number | null;
  pricingTiers: ProductListingPricingTierRecord[];
  packageType: ProductListingPackageType | null;
  leadTimeDays: number | null;
  shippingTime: ProductListingShippingTime | null;
  deliveryMethods: ProductListingDeliveryMethod[];
  dynamicFreightAgreement: boolean;
  packageLengthCm: Prisma.Decimal | null;
  packageWidthCm: Prisma.Decimal | null;
  packageHeightCm: Prisma.Decimal | null;
  packageWeightKg: Prisma.Decimal | null;
  submittedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sectors: ProductListingSectorRecord[];
  media: ProductListingMediaRecord[];
};

export type ProductListingManagementStatusFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'PASSIVE'
  | 'OUT_OF_STOCK';

export type ProductListingManagementFilters = {
  supplierId: string;
  categoryId?: string;
  status: ProductListingManagementStatusFilter;
  skip: number;
  take: number;
};

export type ProductListingManagementResult = {
  total: number;
  items: ProductListingRecord[];
  summary: {
    totalProducts: number;
    pendingReview: number;
    rejected: number;
    passive: number;
    outOfStock: number;
  };
};

export type AdminProductListingStatusFilter =
  | 'ALL'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DRAFT';

export type AdminProductListingListFilters = {
  status: AdminProductListingStatusFilter;
  categoryId?: string;
  skip: number;
  take: number;
};

export type AdminProductListingListResult = {
  total: number;
  items: ProductListingRecord[];
};

export type CategoryDistributionRecord = {
  categoryId: string;
  categoryName: string;
  count: number;
};

export type CreateProductInput = {
  name: string;
  slug: string;
  categoryId: string;
  sectorId: string | null;
};

export type CreateProductListingInput = {
  supplierId: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  sectorIds: string[];
  featuredFeatures: string[];
  isCustomizable: boolean;
  customizationNote: string | null;
};

export type UpdateProductListingStepOneInput = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  sectorIds: string[];
  featuredFeatures: string[];
  isCustomizable: boolean;
  customizationNote: string | null;
};

export type UpdateProductListingStepTwoInput = {
  basePrice: number;
  currency: string;
  minOrderQuantity: number;
  stock: number;
  isNegotiationEnabled: boolean;
  negotiationThreshold: number | null;
  pricingTiers: ProductListingPricingTierRecord[];
};

export type UpdateProductListingStepThreeInput = {
  packageType: ProductListingPackageType;
  leadTimeDays: number;
  shippingTime: ProductListingShippingTime;
  deliveryMethods: ProductListingDeliveryMethod[];
  dynamicFreightAgreement: boolean;
  packageLengthCm: number;
  packageWidthCm: number;
  packageHeightCm: number;
  packageWeightKg: number;
};

export type CreateProductListingMediaInput = {
  productListingId: string;
  mediaType: ProductListingMediaType;
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  displayOrder: number;
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<ProductRecord | null> {
    return this.prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        sectorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findCategoryById(categoryId: string): Promise<CategorySummary | null> {
    return this.prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        level: true,
        isActive: true,
      },
    });
  }

  async ensureHiddenOtherCategory(): Promise<CategorySummary> {
    return this.prisma.$transaction(async (tx) => {
      const existingLeaf = await tx.category.findUnique({
        where: {
          slug: HIDDEN_OTHER_CATEGORY_SLUG,
        },
        select: {
          id: true,
          name: true,
          level: true,
          isActive: true,
        },
      });

      if (existingLeaf) {
        return existingLeaf;
      }

      let root = await tx.category.findUnique({
        where: {
          slug: HIDDEN_OTHER_CATEGORY_ROOT_SLUG,
        },
        select: {
          id: true,
        },
      });

      if (!root) {
        const maxRootSortOrder = await tx.category.aggregate({
          where: {
            parentId: null,
          },
          _max: {
            sortOrder: true,
          },
        });

        root = await tx.category.create({
          data: {
            name: 'DİĞER (GİZLİ ANA)',
            slug: HIDDEN_OTHER_CATEGORY_ROOT_SLUG,
            level: 1,
            parentId: null,
            sortOrder: (maxRootSortOrder._max.sortOrder ?? -1) + 1,
            isActive: false,
          },
          select: {
            id: true,
          },
        });
      }

      let sub = await tx.category.findUnique({
        where: {
          slug: HIDDEN_OTHER_CATEGORY_SUB_SLUG,
        },
        select: {
          id: true,
        },
      });

      if (!sub) {
        const maxSubSortOrder = await tx.category.aggregate({
          where: {
            parentId: root.id,
          },
          _max: {
            sortOrder: true,
          },
        });

        sub = await tx.category.create({
          data: {
            name: 'DİĞER (GİZLİ ALT)',
            slug: HIDDEN_OTHER_CATEGORY_SUB_SLUG,
            level: 2,
            parentId: root.id,
            sortOrder: (maxSubSortOrder._max.sortOrder ?? -1) + 1,
            isActive: false,
          },
          select: {
            id: true,
          },
        });
      }

      const maxLeafSortOrder = await tx.category.aggregate({
        where: {
          parentId: sub.id,
        },
        _max: {
          sortOrder: true,
        },
      });

      return tx.category.create({
        data: {
          name: 'DİĞER',
          slug: HIDDEN_OTHER_CATEGORY_SLUG,
          level: 3,
          parentId: sub.id,
          sortOrder: (maxLeafSortOrder._max.sortOrder ?? -1) + 1,
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          level: true,
          isActive: true,
        },
      });
    });
  }

  async findSectorById(sectorId: string): Promise<SectorSummary | null> {
    return this.prisma.sector.findUnique({
      where: { id: sectorId },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  }

  async ensureHiddenOtherSector(): Promise<SectorSummary> {
    const existing = await this.prisma.sector.findUnique({
      where: {
        slug: HIDDEN_OTHER_SECTOR_SLUG,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (existing) {
      return existing;
    }

    const maxSortOrder = await this.prisma.sector.aggregate({
      _max: {
        sortOrder: true,
      },
    });

    return this.prisma.sector.create({
      data: {
        name: 'Diğer',
        slug: HIDDEN_OTHER_SECTOR_SLUG,
        sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  }

  async create(input: CreateProductInput): Promise<ProductRecord> {
    return this.prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          categoryId: input.categoryId,
          sectorId: input.sectorId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          sectorId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  async findAll(): Promise<ProductRecord[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        sectorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findManySectorsByIds(sectorIds: string[]): Promise<SectorSummary[]> {
    if (sectorIds.length === 0) {
      return [];
    }

    return this.prisma.sector.findMany({
      where: {
        id: {
          in: sectorIds,
        },
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  }

  async findProductListingBySupplierAndSku(
    supplierId: string,
    sku: string,
  ): Promise<ProductListingRecord | null> {
    return this.prisma.productListing.findFirst({
      where: {
        supplierId,
        sku,
        deletedAt: null,
      },
      select: productListingSelect,
    }).then((record) => this.mapListingRecordOrNull(record));
  }

  async findProductListingBySupplierAndSlug(
    supplierId: string,
    slug: string,
  ): Promise<ProductListingRecord | null> {
    return this.prisma.productListing.findFirst({
      where: {
        supplierId,
        slug,
        deletedAt: null,
      },
      select: productListingSelect,
    }).then((record) => this.mapListingRecordOrNull(record));
  }

  async createProductListing(input: CreateProductListingInput): Promise<ProductListingRecord> {
    const created = await this.prisma.$transaction(async (tx) => {
      const listing = await tx.productListing.create({
        data: {
          supplierId: input.supplierId,
          name: input.name,
          slug: input.slug,
          sku: input.sku,
          description: input.description,
          categoryId: input.categoryId,
          featuredFeatures: input.featuredFeatures,
          isCustomizable: input.isCustomizable,
          customizationNote: input.customizationNote,
        },
        select: {
          id: true,
        },
      });

      if (input.sectorIds.length > 0) {
        await tx.productListingSector.createMany({
          data: input.sectorIds.map((sectorId) => ({
            productListingId: listing.id,
            sectorId,
          })),
        });
      }

      return tx.productListing.findUniqueOrThrow({
        where: {
          id: listing.id,
        },
        select: productListingSelect,
      });
    });

    return this.mapListingRecord(created);
  }

  async findProductListingBySupplierAndId(
    supplierId: string,
    id: string,
  ): Promise<ProductListingRecord | null> {
    const listing = await this.prisma.productListing.findFirst({
      where: {
        id,
        supplierId,
        deletedAt: null,
      },
      select: productListingSelect,
    });

    return this.mapListingRecordOrNull(listing);
  }

  async findProductListingsBySupplier(
    supplierId: string,
  ): Promise<ProductListingRecord[]> {
    const listings = await this.prisma.productListing.findMany({
      where: {
        supplierId,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }],
      select: productListingSelect,
    });

    return listings.map((listing) => this.mapListingRecord(listing));
  }

  async findProductListingsForSupplierManagement(
    input: ProductListingManagementFilters,
  ): Promise<ProductListingManagementResult> {
    const baseWhere: Prisma.ProductListingWhereInput = {
      supplierId: input.supplierId,
      deletedAt: null,
    };

    const where: Prisma.ProductListingWhereInput = { ...baseWhere };

    if (input.categoryId) {
      where.categoryId = input.categoryId;
    }

    if (input.status === 'ACTIVE') {
      where.status = ProductListingStatus.APPROVED;
      where.isActive = true;
    } else if (input.status === 'PENDING_REVIEW') {
      where.status = ProductListingStatus.PENDING_REVIEW;
    } else if (input.status === 'REJECTED') {
      where.status = ProductListingStatus.REJECTED;
    } else if (input.status === 'PASSIVE') {
      where.isActive = false;
    } else if (input.status === 'OUT_OF_STOCK') {
      where.stock = 0;
    }

    const [
      total,
      items,
      totalProducts,
      pendingReview,
      rejected,
      passive,
      outOfStock,
    ] = await this.prisma.$transaction([
      this.prisma.productListing.count({ where }),
      this.prisma.productListing.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: input.skip,
        take: input.take,
        select: productListingSelect,
      }),
      this.prisma.productListing.count({ where: baseWhere }),
      this.prisma.productListing.count({
        where: { ...baseWhere, status: ProductListingStatus.PENDING_REVIEW },
      }),
      this.prisma.productListing.count({
        where: { ...baseWhere, status: ProductListingStatus.REJECTED },
      }),
      this.prisma.productListing.count({
        where: { ...baseWhere, isActive: false },
      }),
      this.prisma.productListing.count({
        where: { ...baseWhere, stock: 0 },
      }),
    ]);

    return {
      total,
      items: items.map((listing) => this.mapListingRecord(listing)),
      summary: {
        totalProducts,
        pendingReview,
        rejected,
        passive,
        outOfStock,
      },
    };
  }

  async findProductListingsForAdmin(): Promise<ProductListingRecord[]> {
    const listings = await this.prisma.productListing.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }],
      select: productListingSelect,
    });

    return listings.map((listing) => this.mapListingRecord(listing));
  }

  async findProductListingsForAdminManagement(
    input: AdminProductListingListFilters,
  ): Promise<AdminProductListingListResult> {
    const where: Prisma.ProductListingWhereInput = {
      deletedAt: null,
    };

    if (input.status !== 'ALL') {
      where.status = input.status;
    }

    if (input.categoryId) {
      where.categoryId = input.categoryId;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.productListing.count({ where }),
      this.prisma.productListing.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: input.skip,
        take: input.take,
        select: productListingSelect,
      }),
    ]);

    return {
      total,
      items: items.map((listing) => this.mapListingRecord(listing)),
    };
  }

  async countProductListingsForAdmin(): Promise<{
    totalProducts: number;
    pendingReview: number;
  }> {
    const whereBase: Prisma.ProductListingWhereInput = {
      deletedAt: null,
    };

    const [totalProducts, pendingReview] = await this.prisma.$transaction([
      this.prisma.productListing.count({ where: whereBase }),
      this.prisma.productListing.count({
        where: {
          ...whereBase,
          status: ProductListingStatus.PENDING_REVIEW,
        },
      }),
    ]);

    return {
      totalProducts,
      pendingReview,
    };
  }

  async countProductListingsCreatedBetween(
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.prisma.productListing.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });
  }

  async getAdminCategoryDistribution(
    topN: number,
  ): Promise<CategoryDistributionRecord[]> {
    const grouped = await this.prisma.productListing.groupBy({
      by: ['categoryId'],
      where: {
        deletedAt: null,
      },
      _count: {
        categoryId: true,
      },
      orderBy: {
        _count: {
          categoryId: 'desc',
        },
      },
      take: topN,
    });

    if (grouped.length === 0) {
      return [];
    }

    const categoryIds = grouped.map((item) => item.categoryId);
    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

    return grouped.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId) ?? 'Bilinmeyen Kategori',
      count: item._count.categoryId,
    }));
  }

  async findProductListingById(
    id: string,
  ): Promise<ProductListingRecord | null> {
    const listing = await this.prisma.productListing.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: productListingSelect,
    });

    return this.mapListingRecordOrNull(listing);
  }

  async updateProductListingReviewByAdmin(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNote: string | null,
  ): Promise<ProductListingRecord> {
    const updated = await this.prisma.productListing.update({
      where: {
        id,
      },
      data: {
        status,
        reviewNote,
      },
      select: productListingSelect,
    });

    return this.mapListingRecord(updated);
  }

  async updateProductListingActiveStatus(
    id: string,
    isActive: boolean,
  ): Promise<ProductListingRecord> {
    const updated = await this.prisma.productListing.update({
      where: { id },
      data: { isActive },
      select: productListingSelect,
    });

    return this.mapListingRecord(updated);
  }

  async softDeleteProductListing(id: string): Promise<ProductListingRecord> {
    const updated = await this.prisma.productListing.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: productListingSelect,
    });

    return this.mapListingRecord(updated);
  }

  async findProductListingMediaById(
    id: string,
  ): Promise<{ filePath: string; mimeType: string; originalName: string } | null> {
    return this.prisma.productListingMedia.findUnique({
      where: { id },
      select: {
        filePath: true,
        mimeType: true,
        originalName: true,
      },
    });
  }

  async updateProductListingStepTwo(
    id: string,
    input: UpdateProductListingStepTwoInput,
  ): Promise<ProductListingRecord> {
    const updated = await this.prisma.productListing.update({
      where: {
        id,
      },
      data: {
        basePrice: input.basePrice,
        currency: input.currency,
        minOrderQuantity: input.minOrderQuantity,
        stock: input.stock,
        isNegotiationEnabled: input.isNegotiationEnabled,
        negotiationThreshold: input.negotiationThreshold,
        pricingTiers: input.pricingTiers as Prisma.InputJsonValue,
      },
      select: productListingSelect,
    });

    return this.mapListingRecord(updated);
  }

  async updateProductListingStepOne(
    id: string,
    input: UpdateProductListingStepOneInput,
  ): Promise<ProductListingRecord> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.productListing.update({
        where: {
          id,
        },
        data: {
          name: input.name,
          slug: input.slug,
          sku: input.sku,
          description: input.description,
          categoryId: input.categoryId,
          featuredFeatures: input.featuredFeatures,
          isCustomizable: input.isCustomizable,
          customizationNote: input.customizationNote,
        },
        select: {
          id: true,
        },
      });

      await tx.productListingSector.deleteMany({
        where: {
          productListingId: id,
        },
      });

      if (input.sectorIds.length > 0) {
        await tx.productListingSector.createMany({
          data: input.sectorIds.map((sectorId) => ({
            productListingId: id,
            sectorId,
          })),
        });
      }

      return tx.productListing.findUniqueOrThrow({
        where: {
          id,
        },
        select: productListingSelect,
      });
    });

    return this.mapListingRecord(updated);
  }

  async updateProductListingStepThree(
    id: string,
    input: UpdateProductListingStepThreeInput,
  ): Promise<ProductListingRecord> {
    const updated = await this.prisma.productListing.update({
      where: {
        id,
      },
      data: {
        packageType: input.packageType,
        leadTimeDays: input.leadTimeDays,
        shippingTime: input.shippingTime,
        deliveryMethods: input.deliveryMethods,
        dynamicFreightAgreement: input.dynamicFreightAgreement,
        packageLengthCm: input.packageLengthCm,
        packageWidthCm: input.packageWidthCm,
        packageHeightCm: input.packageHeightCm,
        packageWeightKg: input.packageWeightKg,
      },
      select: productListingSelect,
    });

    return this.mapListingRecord(updated);
  }

  async countProductListingMedia(productListingId: string): Promise<number> {
    return this.prisma.productListingMedia.count({
      where: {
        productListingId,
      },
    });
  }

  async createProductListingMedia(
    inputs: CreateProductListingMediaInput[],
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    await this.prisma.productListingMedia.createMany({
      data: inputs.map((input) => ({
        productListingId: input.productListingId,
        mediaType: input.mediaType,
        filePath: input.filePath,
        originalName: input.originalName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        displayOrder: input.displayOrder,
      })),
    });
  }

  async updateProductListingStatus(
    id: string,
    status: ProductListingStatus,
    reviewNote: string | null,
    submittedAt: Date | null,
  ): Promise<ProductListingRecord> {
    const updated = await this.prisma.productListing.update({
      where: {
        id,
      },
      data: {
        status,
        reviewNote,
        submittedAt,
      },
      select: productListingSelect,
    });

    return this.mapListingRecord(updated);
  }

  private mapListingRecordOrNull(
    listing: ProductListingSelectRecord | null,
  ): ProductListingRecord | null {
    if (!listing) {
      return null;
    }

    return this.mapListingRecord(listing);
  }

  private mapListingRecord(
    listing: ProductListingSelectRecord,
  ): ProductListingRecord {
    const pricingTiers = this.parsePricingTiers(listing.pricingTiers);
    const { category, ...restListing } = listing;

    return {
      ...restListing,
      categoryName: category.name,
      pricingTiers,
      sectors: listing.sectors.map((item) => ({
        sectorId: item.sectorId,
        sectorName: item.sector.name,
      })),
    };
  }

  private parsePricingTiers(value: Prisma.JsonValue): ProductListingPricingTierRecord[] {
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

        if (!Number.isFinite(minQuantity) || !Number.isFinite(maxQuantity) || !Number.isFinite(unitPrice)) {
          return null;
        }

        if (!Number.isInteger(minQuantity) || !Number.isInteger(maxQuantity)) {
          return null;
        }

        return {
          minQuantity,
          maxQuantity,
          unitPrice,
        };
      })
      .filter((tier): tier is ProductListingPricingTierRecord => tier !== null);
  }
}
