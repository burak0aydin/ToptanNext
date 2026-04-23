import type {
  ProductListingFeaturedFeature,
  ProductListingVariantGroup,
  ProductListingStepOneDto,
  ProductListingStepThreeDto,
  ProductListingStepTwoDto,
  ProductListingSubmitDto,
  ProductListingDeliveryMethod,
  ProductListingPackageType,
  ProductListingShippingTime,
} from '@toptannext/types';
import { requestJson } from '@/lib/api';

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: CategoryTreeNode[];
};

export type SectorRecord = {
  id: string;
  name: string;
  slug: string;
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

export type ProductListingMediaRecord = {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  displayOrder: number;
  createdAt: string;
};

export type ProductListingRecord = {
  id: string;
  supplierId: string;
  supplierName: string | null;
  supplierCompanyName: string | null;
  supplierCity: string | null;
  supplierDistrict: string | null;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  featuredFeatures: ProductListingFeaturedFeature[];
  isCustomizable: boolean;
  customizationNote: string | null;
  variantGroups: ProductListingVariantGroup[];
  basePrice: string | null;
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
  packageLengthCm: string | null;
  packageWidthCm: string | null;
  packageHeightCm: string | null;
  packageWeightKg: string | null;
  submittedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sectors: ProductListingSectorRecord[];
  media: ProductListingMediaRecord[];
};

export type ProductListingManagementStatus =
  | 'ALL'
  | 'ACTIVE'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'PASSIVE'
  | 'OUT_OF_STOCK';

export type ProductListingManagementResult = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: ProductListingRecord[];
  summary: {
    totalProducts: number;
    pendingReview: number;
    rejected: number;
    passive: number;
    outOfStock: number;
  };
};

export type ProductListingManagementQuery = {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: ProductListingManagementStatus;
};

export type PublicProductListingSort = 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC';
export type PublicProductListingMsmRange =
  | 'ANY'
  | 'RANGE_1_100'
  | 'RANGE_100_500'
  | 'RANGE_500_PLUS';

export type PublicProductListingQuery = {
  page?: number;
  limit?: number;
  categoryIds?: string[];
  sectorId?: string;
  minPrice?: number;
  maxPrice?: number;
  msmRange?: PublicProductListingMsmRange;
  sort?: PublicProductListingSort;
};

export type PublicProductListingResult = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: ProductListingRecord[];
};

export type AdminProductListingStatus =
  | "ALL"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT";

export type AdminProductListingGrowthPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export type AdminProductListingManagementQuery = {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: AdminProductListingStatus;
  period?: AdminProductListingGrowthPeriod;
};

export type AdminProductListingManagementResult = {
  summary: {
    totalProducts: number;
    pendingReview: number;
  };
  growth: {
    period: AdminProductListingGrowthPeriod;
    labels: string[];
    values: number[];
  };
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    percentage: number;
  }>;
  listings: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    items: ProductListingRecord[];
  };
};

function normalizeFeaturedFeature(
  value: unknown,
): ProductListingFeaturedFeature | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (typeof value === 'string') {
      const title = value.trim();
      if (title.length > 0) {
        return {
          title,
          description: '',
        };
      }
    }

    return null;
  }

  const typedValue = value as Record<string, unknown>;
  const title = typeof typedValue.title === 'string' ? typedValue.title.trim() : '';
  const description = typeof typedValue.description === 'string'
    ? typedValue.description.trim()
    : '';

  if (title.length === 0) {
    return null;
  }

  return {
    title,
    description,
  };
}

function normalizeProductListingRecord(record: ProductListingRecord): ProductListingRecord {
  const featuredFeatures = Array.isArray(record.featuredFeatures)
    ? record.featuredFeatures
      .map((feature) => normalizeFeaturedFeature(feature))
      .filter((feature): feature is ProductListingFeaturedFeature => feature !== null)
    : [];

  return {
    ...record,
    featuredFeatures,
  };
}

export async function fetchCategoriesTree(): Promise<CategoryTreeNode[]> {
  return requestJson<CategoryTreeNode[]>('/categories', {
    auth: true,
  });
}

export async function fetchSectors(): Promise<SectorRecord[]> {
  return requestJson<SectorRecord[]>('/sectors', {
    auth: true,
  });
}

export async function fetchPublicProductListings(
  query: PublicProductListingQuery = {},
): Promise<PublicProductListingResult> {
  const searchParams = new URLSearchParams();

  if (query.page) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  if (query.categoryIds && query.categoryIds.length > 0) {
    searchParams.set('categoryIds', query.categoryIds.join(','));
  }

  if (query.sectorId) {
    searchParams.set('sectorId', query.sectorId);
  }

  if (query.sort) {
    searchParams.set('sort', query.sort);
  }

  if (query.minPrice !== undefined) {
    searchParams.set('minPrice', String(query.minPrice));
  }

  if (query.maxPrice !== undefined) {
    searchParams.set('maxPrice', String(query.maxPrice));
  }

  if (query.msmRange) {
    searchParams.set('msmRange', query.msmRange);
  }

  const queryString = searchParams.toString();
  const result = await requestJson<PublicProductListingResult>(
    `/products/public/listings${queryString ? `?${queryString}` : ''}`,
  );

  return {
    ...result,
    items: result.items.map((item) => normalizeProductListingRecord(item)),
  };
}

export async function fetchPublicProductListingById(
  listingId: string,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord>(
    `/products/public/listings/${listingId}`,
  );

  return normalizeProductListingRecord(record);
}

export async function fetchMyProductListings(
  query: ProductListingManagementQuery = {},
): Promise<ProductListingManagementResult> {
  const searchParams = new URLSearchParams();

  if (query.page) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  if (query.categoryId) {
    searchParams.set('categoryId', query.categoryId);
  }

  if (query.status && query.status !== 'ALL') {
    searchParams.set('status', query.status);
  }

  const queryString = searchParams.toString();

  const result = await requestJson<ProductListingManagementResult>(
    `/products/me/listings${queryString ? `?${queryString}` : ''}`,
    {
      auth: true,
    },
  );

  return {
    ...result,
    items: result.items.map((item) => normalizeProductListingRecord(item)),
  };
}

export async function fetchMyProductListingDrafts(): Promise<ProductListingRecord[]> {
  const records = await requestJson<ProductListingRecord[]>('/products/me/listings/drafts', {
    auth: true,
  });

  return records.map((record) => normalizeProductListingRecord(record));
}

export async function fetchAdminProductListings(
  query: AdminProductListingManagementQuery = {},
): Promise<AdminProductListingManagementResult> {
  const searchParams = new URLSearchParams();

  if (query.page) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  if (query.categoryId) {
    searchParams.set('categoryId', query.categoryId);
  }

  if (query.status && query.status !== 'ALL') {
    searchParams.set('status', query.status);
  }

  if (query.period) {
    searchParams.set('period', query.period);
  }

  const queryString = searchParams.toString();

  const result = await requestJson<AdminProductListingManagementResult>(
    `/products/admin/listings${queryString ? `?${queryString}` : ''}`,
    {
      auth: true,
    },
  );

  return {
    ...result,
    listings: {
      ...result.listings,
      items: result.listings.items.map((item) => normalizeProductListingRecord(item)),
    },
  };
}

export async function reviewProductListingByAdmin(
  id: string,
  payload: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string },
): Promise<ProductListingRecord> {
  const record = await requestJson<
    ProductListingRecord,
    { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }
  >(
    `/products/admin/listings/${id}/review`,
    {
      method: 'PATCH',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function fetchAdminProductListingById(
  id: string,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord>(`/products/admin/listings/${id}`, {
    auth: true,
  });

  return normalizeProductListingRecord(record);
}

export async function updateAdminProductListingStepOne(
  listingId: string,
  payload: ProductListingStepOneDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepOneDto>(
    `/products/admin/listings/${listingId}/step-one`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function updateAdminProductListingStepTwo(
  listingId: string,
  payload: ProductListingStepTwoDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepTwoDto>(
    `/products/admin/listings/${listingId}/step-two`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function updateAdminProductListingStepThree(
  listingId: string,
  payload: ProductListingStepThreeDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepThreeDto>(
    `/products/admin/listings/${listingId}/step-three`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export function resolveProductListingMediaUrl(mediaId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  return `${baseUrl}/products/media/${mediaId}`;
}

export async function updateProductListingActiveStatus(
  listingId: string,
  isActive: boolean,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, { isActive: boolean }>(
    `/products/me/listings/${listingId}/active`,
    {
      method: 'PATCH',
      auth: true,
      body: { isActive },
    },
  );

  return normalizeProductListingRecord(record);
}

export async function deleteProductListing(
  listingId: string,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord>(`/products/me/listings/${listingId}`, {
    method: 'DELETE',
    auth: true,
  });

  return normalizeProductListingRecord(record);
}

export async function fetchMyProductListingById(
  listingId: string,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord>(`/products/me/listings/${listingId}`, {
    auth: true,
  });

  return normalizeProductListingRecord(record);
}

export async function createProductListingStepOne(
  payload: ProductListingStepOneDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepOneDto>(
    '/products/me/listings/step-one',
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function updateProductListingStepOne(
  listingId: string,
  payload: ProductListingStepOneDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepOneDto>(
    `/products/me/listings/${listingId}/step-one`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function updateProductListingStepTwo(
  listingId: string,
  payload: ProductListingStepTwoDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepTwoDto>(
    `/products/me/listings/${listingId}/step-two`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function updateProductListingStepThree(
  listingId: string,
  payload: ProductListingStepThreeDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingStepThreeDto>(
    `/products/me/listings/${listingId}/step-three`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function uploadProductListingMedia(
  listingId: string,
  mediaFiles: File[],
): Promise<ProductListingRecord> {
  const formData = new FormData();
  mediaFiles.forEach((file) => {
    formData.append('mediaFiles', file);
  });

  const record = await requestJson<ProductListingRecord, FormData>(
    `/products/me/listings/${listingId}/media`,
    {
      method: 'POST',
      auth: true,
      body: formData,
    },
  );

  return normalizeProductListingRecord(record);
}

export async function submitProductListing(
  listingId: string,
  payload: ProductListingSubmitDto,
): Promise<ProductListingRecord> {
  const record = await requestJson<ProductListingRecord, ProductListingSubmitDto>(
    `/products/me/listings/${listingId}/submit`,
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );

  return normalizeProductListingRecord(record);
}
