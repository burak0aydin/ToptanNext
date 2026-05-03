import { requestJson } from '@/lib/api';

export interface PaymentCardRecord {
  id: string;
  userId: string;
  cardHolderName: string;
  brand: string;
  lastFour: string;
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentCardInput {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolderName: string;
}

export interface UpdatePaymentCardInput {
  expiry: string;
  cardHolderName: string;
}

export async function fetchPaymentCards(): Promise<PaymentCardRecord[]> {
  return requestJson<PaymentCardRecord[]>('/payment-cards', {
    method: 'GET',
    auth: true,
  });
}

export async function createPaymentCard(
  data: CreatePaymentCardInput,
): Promise<PaymentCardRecord> {
  return requestJson<PaymentCardRecord>('/payment-cards', {
    method: 'POST',
    auth: true,
    body: data,
  });
}

export async function deletePaymentCard(cardId: string): Promise<void> {
  return requestJson<void>(`/payment-cards/${cardId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function updatePaymentCard(
  cardId: string,
  data: UpdatePaymentCardInput,
): Promise<PaymentCardRecord> {
  return requestJson<PaymentCardRecord>(`/payment-cards/${cardId}`, {
    method: 'PUT',
    auth: true,
    body: data,
  });
}

export async function selectPaymentCard(cardId: string): Promise<PaymentCardRecord> {
  return requestJson<PaymentCardRecord>(`/payment-cards/${cardId}/select`, {
    method: 'PUT',
    auth: true,
  });
}
