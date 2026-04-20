import type {
  ProductListingStepOneDto,
  ProductListingStepThreeDto,
  ProductListingStepTwoDto,
  ProductListingSubmitDto,
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
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  featuredFeatures: string[];
  isCustomizable: boolean;
  customizationNote: string | null;
  basePrice: string | null;
  currency: string;
  minOrderQuantity: number | null;
  stock: number | null;
  leadTimeDays: number | null;
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

export async function fetchMyProductListings(): Promise<ProductListingRecord[]> {
  return requestJson<ProductListingRecord[]>('/products/me/listings', {
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
