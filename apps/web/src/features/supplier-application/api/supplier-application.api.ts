import type {
  SupplierApplicationStepOneDto,
  SupplierApplicationStepTwoDto,
} from '@toptannext/types';
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
  city: string;
  district: string;
  referenceCode: string | null;
  companyIban: string | null;
  kepAddress: string | null;
  isEInvoiceTaxpayer: boolean | null;
  businessPhone: string | null;
  headquartersAddress: string | null;
  warehouseSameAsHeadquarters: boolean | null;
  warehouseAddress: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactRole: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  reviewedAt: string | null;
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

export async function upsertMySupplierContactFinance(
  payload: SupplierApplicationStepTwoDto,
): Promise<SupplierApplicationRecord> {
  return requestJson<SupplierApplicationRecord, SupplierApplicationStepTwoDto>(
    '/supplier-applications/me/contact-finance',
    {
      method: 'PUT',
      auth: true,
      body: payload,
    },
  );
}
