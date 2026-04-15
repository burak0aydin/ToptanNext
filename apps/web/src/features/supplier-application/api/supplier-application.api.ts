import type {
  SupplierApplicationDocumentType,
  SupplierApplicationStepOneDto,
  SupplierApplicationStepThreeDto,
  SupplierApplicationStepTwoDto,
} from "@toptannext/types";
import { requestJson } from "@/lib/api";

export type SupplierApplicationDocumentRecord = {
  id: string;
  documentType: SupplierApplicationDocumentType;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};

export type UpsertSupplierDocumentsPayload = SupplierApplicationStepThreeDto & {
  taxCertificate?: File | null;
  signatureCircular?: File | null;
  tradeRegistryGazette?: File | null;
  activityCertificate?: File | null;
};

export type SupplierApplicationRecord = {
  id: string;
  userId: string;
  companyName: string;
  companyType: "SAHIS" | "LIMITED" | "ANONIM";
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
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  reviewedAt: string | null;
  approvedSupplierAgreement: boolean;
  approvedKvkkAgreement: boolean;
  approvedCommercialMessage: boolean;
  documents: SupplierApplicationDocumentRecord[];
  createdAt: string;
  updatedAt: string;
};

export async function fetchMySupplierApplication(): Promise<SupplierApplicationRecord | null> {
  return requestJson<SupplierApplicationRecord | null>(
    "/supplier-applications/me",
    {
      auth: true,
    },
  );
}

export async function upsertMySupplierApplication(
  payload: SupplierApplicationStepOneDto,
): Promise<SupplierApplicationRecord> {
  return requestJson<SupplierApplicationRecord, SupplierApplicationStepOneDto>(
    "/supplier-applications/me",
    {
      method: "PUT",
      auth: true,
      body: payload,
    },
  );
}

export async function upsertMySupplierContactFinance(
  payload: SupplierApplicationStepTwoDto,
): Promise<SupplierApplicationRecord> {
  return requestJson<SupplierApplicationRecord, SupplierApplicationStepTwoDto>(
    "/supplier-applications/me/contact-finance",
    {
      method: "PUT",
      auth: true,
      body: payload,
    },
  );
}

export async function upsertMySupplierDocuments(
  payload: UpsertSupplierDocumentsPayload,
): Promise<SupplierApplicationRecord> {
  const formData = new FormData();
  formData.append(
    "approvedSupplierAgreement",
    String(payload.approvedSupplierAgreement),
  );
  formData.append(
    "approvedKvkkAgreement",
    String(payload.approvedKvkkAgreement),
  );
  formData.append(
    "approvedCommercialMessage",
    String(payload.approvedCommercialMessage),
  );

  if (payload.taxCertificate) {
    formData.append("taxCertificate", payload.taxCertificate);
  }
  if (payload.signatureCircular) {
    formData.append("signatureCircular", payload.signatureCircular);
  }
  if (payload.tradeRegistryGazette) {
    formData.append("tradeRegistryGazette", payload.tradeRegistryGazette);
  }
  if (payload.activityCertificate) {
    formData.append("activityCertificate", payload.activityCertificate);
  }

  return requestJson<SupplierApplicationRecord, FormData>(
    "/supplier-applications/me/documents",
    {
      method: "PUT",
      auth: true,
      body: formData,
    },
  );
}
