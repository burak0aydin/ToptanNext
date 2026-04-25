import { requestJson } from '@/lib/api';

export type CartItemRecord = {
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
  createdAt: string;
  updatedAt: string;
};

export type CartSummary = {
  items: CartItemRecord[];
  totalItems: number;
  subtotal: string | null;
  currency: string;
};

export async function fetchCart(): Promise<CartSummary> {
  return requestJson<CartSummary>('/cart', {
    auth: true,
  });
}

export async function addCartItem(payload: {
  productListingId: string;
  quantity?: number;
}): Promise<CartSummary> {
  return requestJson<CartSummary, typeof payload>('/cart/items', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function updateCartItem(
  itemId: string,
  payload: { quantity: number },
): Promise<CartSummary> {
  return requestJson<CartSummary, typeof payload>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

export async function removeCartItem(
  itemId: string,
): Promise<{ cart: CartSummary; removedItemId: string }> {
  return requestJson<{ cart: CartSummary; removedItemId: string }>(`/cart/items/${itemId}`, {
    method: 'DELETE',
    auth: true,
  });
}
