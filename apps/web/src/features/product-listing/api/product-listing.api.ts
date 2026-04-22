import type {
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
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  featuredFeatures: string[];
  isCustomizable: boolean;
  customizationNote: string | null;
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

  return requestJson<ProductListingManagementResult>(
    `/products/me/listings${queryString ? `?${queryString}` : ''}`,
    {
      auth: true,
    },
  );
}

export async function fetchMyProductListingDrafts(): Promise<ProductListingRecord[]> {
  return requestJson<ProductListingRecord[]>('/products/me/listings/drafts', {
    auth: true,
  });
}

export async function fetchAdminProductListings(): Promise<ProductListingRecord[]> {
  return requestJson<ProductListingRecord[]>('/products/admin/listings', {
    auth: true,
  });
}

export function resolveProductListingMediaUrl(mediaId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  return `${baseUrl}/products/media/${mediaId}`;
}

export async function updateProductListingActiveStatus(
  listingId: string,
  isActive: boolean,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord, { isActive: boolean }>(
    `/products/me/listings/${listingId}/active`,
    {
      method: 'PATCH',
      auth: true,
      body: { isActive },
    },
  );
}

export async function deleteProductListing(
  listingId: string,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord>(`/products/me/listings/${listingId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function fetchMyProductListingById(
  listingId: string,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord>(`/products/me/listings/${listingId}`, {
    auth: true,
  });
}

export async function createProductListingStepOne(
  payload: ProductListingStepOneDto,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord, ProductListingStepOneDto>(
    '/products/me/listings/step-one',
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );
}

export async function updateProductListingStepOne(
  listingId: string,
  payload: ProductListingStepOneDto,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord, ProductListingStepOneDto>(
    `/products/me/listings/${listingId}/step-one`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );
}

export async function updateProductListingStepTwo(
  listingId: string,
  payload: ProductListingStepTwoDto,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord, ProductListingStepTwoDto>(
    `/products/me/listings/${listingId}/step-two`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );
}

export async function updateProductListingStepThree(
  listingId: string,
  payload: ProductListingStepThreeDto,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord, ProductListingStepThreeDto>(
    `/products/me/listings/${listingId}/step-three`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );
}

export async function uploadProductListingMedia(
  listingId: string,
  mediaFiles: File[],
): Promise<ProductListingRecord> {
  const formData = new FormData();
  mediaFiles.forEach((file) => {
    formData.append('mediaFiles', file);
  });

  return requestJson<ProductListingRecord, FormData>(
    `/products/me/listings/${listingId}/media`,
    {
      method: 'POST',
      auth: true,
      body: formData,
    },
  );
}

export async function submitProductListing(
  listingId: string,
  payload: ProductListingSubmitDto,
): Promise<ProductListingRecord> {
  return requestJson<ProductListingRecord, ProductListingSubmitDto>(
    `/products/me/listings/${listingId}/submit`,
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );
}
