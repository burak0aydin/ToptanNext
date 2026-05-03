import { requestJson } from '@/lib/api';

export interface AddressRecord {
  id: string;
  userId: string;
  title: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  neighborhood: string;
  address: string;
  postalCode: string;
  isSelected: boolean;
  invoiceType: 'individual' | 'corporate';
  taxId?: string;
  taxOffice?: string;
  companyName?: string;
  isETaxPayer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  title: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  neighborhood: string;
  address: string;
  postalCode: string;
  invoiceType: 'individual' | 'corporate';
  taxId?: string;
  taxOffice?: string;
  companyName?: string;
  isETaxPayer?: boolean;
}

export async function fetchUserAddresses(): Promise<AddressRecord[]> {
  return requestJson<AddressRecord[]>('/addresses', { method: 'GET', auth: true });
}

export async function createAddress(data: CreateAddressInput): Promise<AddressRecord> {
  return requestJson<AddressRecord>('/addresses', {
    method: 'POST',
    auth: true,
    body: data,
  });
}

export async function updateAddress(
  addressId: string,
  data: Partial<CreateAddressInput>,
): Promise<AddressRecord> {
  return requestJson<AddressRecord>(`/addresses/${addressId}`, {
    method: 'PUT',
    auth: true,
    body: data,
  });
}

export async function deleteAddress(addressId: string): Promise<void> {
  return requestJson<void>(`/addresses/${addressId}`, { method: 'DELETE', auth: true });
}

export async function selectAddress(addressId: string): Promise<AddressRecord> {
  return requestJson<AddressRecord>(`/addresses/${addressId}/select`, {
    method: 'PUT',
    auth: true,
  });
}
