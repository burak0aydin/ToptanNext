import { requestJson } from '@/lib/api';

export type ProductReviewRecord = {
  id: string;
  rating: number;
  comment: string | null;
  buyerName: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductReviewsResult = {
  summary: {
    count: number;
    averageRating: number;
  };
  items: ProductReviewRecord[];
};

export type MyProductReviewState = {
  canReview: boolean;
  reason: string | null;
  myReview: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export async function fetchProductReviews(productListingId: string): Promise<ProductReviewsResult> {
  return requestJson<ProductReviewsResult>(`/product-reviews/product/${productListingId}`);
}

export async function fetchMyProductReviewState(productListingId: string): Promise<MyProductReviewState> {
  return requestJson<MyProductReviewState>(`/product-reviews/product/${productListingId}/me`, {
    auth: true,
  });
}

export async function upsertProductReview(
  productListingId: string,
  payload: {
    rating: number;
    comment?: string;
  },
): Promise<MyProductReviewState['myReview']> {
  return requestJson<MyProductReviewState['myReview'], typeof payload>(
    `/product-reviews/product/${productListingId}`,
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );
}
