import type { SupplierApplicationStepOneDto } from '@toptannext/types';
import { requestJson } from '@/lib/api';

export type SupplierApplicationRecord = {
  id: string;
  userId: string;
  companyName: string;
  companyType: 'SAHIS' | 'LIMITED' | 'ANONIM';
  vknOrTckn: string;
  taxOffice: string;
  mersisNo: string;
  tradeRegistryNo: string | null;
  activitySector: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMySupplierApplication(): Promise<SupplierApplicationRecord | null> {
  return requestJson<SupplierApplicationRecord | null>('/supplier-applications/me', {
    auth: true,
  });
}

export async function upsertMySupplierApplication(
  payload: SupplierApplicationStepOneDto,
): Promise<SupplierApplicationRecord> {
  return requestJson<SupplierApplicationRecord, SupplierApplicationStepOneDto>(
    '/supplier-applications/me',
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );
}
