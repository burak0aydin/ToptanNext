import { requestJson } from '@/lib/api';

export type CheckoutOrderResult = {
  id: string;
  status: string;
  subtotal: string;
  currency: string;
  items: Array<{
    id: string;
    productListingId: string;
    quantity: number;
    unitPrice: string;
    currency: string;
  }>;
  createdAt: string;
};

export async function checkoutOrder(): Promise<CheckoutOrderResult> {
  return requestJson<CheckoutOrderResult>('/orders/checkout', {
    method: 'POST',
    auth: true,
  });
}
