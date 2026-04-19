import type {
  SupplierApplicationDocumentType,
  SupplierApplicationStepOneDto,
  SupplierApplicationStepThreeDto,
  SupplierApplicationStepTwoDto,
} from "@toptannext/types";
import { requestJson } from "@/lib/api";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

let refreshDocumentTokenRequest: Promise<string | null> | null = null;

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

export type SupplierApplicationAdminListItem = {
  id: string;
  userId: string;
  companyName: string;
  companyType: "SAHIS" | "LIMITED" | "ANONIM";
  vknOrTckn: string;
  activitySector: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  contactEmail: string | null;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSupplierApplicationPayload = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote?: string;
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

  try {
    return await requestJson<SupplierApplicationRecord, FormData>(
      "/supplier-applications/me/documents",
      {
        method: "PUT",
        auth: true,
        body: formData,
      },
    );
  } catch (error) {
    if (error instanceof Error && /file too large/i.test(error.message)) {
      throw new Error("Yüklenen dosya 15 MB sınırını aşıyor.");
    }

    throw error;
  }
}

export async function fetchSupplierApplicationsForAdmin(): Promise<
  SupplierApplicationAdminListItem[]
> {
  return requestJson<SupplierApplicationAdminListItem[]>(
    "/supplier-applications/admin",
    {
      auth: true,
    },
  );
}

export async function fetchSupplierApplicationByIdForAdmin(
  id: string,
): Promise<SupplierApplicationRecord> {
  return requestJson<SupplierApplicationRecord>(
    `/supplier-applications/admin/${id}`,
    {
      auth: true,
    },
  );
}

export async function reviewSupplierApplicationByAdmin(
  id: string,
  payload: ReviewSupplierApplicationPayload,
): Promise<SupplierApplicationRecord> {
  return requestJson<SupplierApplicationRecord, ReviewSupplierApplicationPayload>(
    `/supplier-applications/admin/${id}/review`,
    {
      method: "PUT",
      auth: true,
      body: payload,
    },
  );
}

function resolveApiErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Belge alınırken bir sorun oluştu.";
  }

  const maybeError = payload as {
    error?: { message?: string };
    message?: string | string[];
  };

  if (
    typeof maybeError.error?.message === "string" &&
    maybeError.error.message.length > 0
  ) {
    return maybeError.error.message;
  }

  if (typeof maybeError.message === "string" && maybeError.message.length > 0) {
    return maybeError.message;
  }

  if (Array.isArray(maybeError.message) && maybeError.message.length > 0) {
    return maybeError.message.join(" ");
  }

  return "Belge alınırken bir sorun oluştu.";
}

function resolveFileNameFromDisposition(disposition: string | null): string {
  if (!disposition) {
    return "belge";
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) {
    return decodeURIComponent(basicMatch[1]);
  }

  return "belge";
}

async function refreshAccessTokenForDocumentDownload(): Promise<string | null> {
  if (refreshDocumentTokenRequest) {
    return refreshDocumentTokenRequest;
  }

  refreshDocumentTokenRequest = (async () => {
    try {
      const payload = await requestJson<{ accessToken: string }>("/auth/refresh", {
        method: "POST",
      });

      if (!payload.accessToken || payload.accessToken.trim().length === 0) {
        clearAccessToken();
        return null;
      }

      setAccessToken(payload.accessToken);
      return payload.accessToken;
    } catch {
      clearAccessToken();
      return null;
    }
  })().finally(() => {
    refreshDocumentTokenRequest = null;
  });

  return refreshDocumentTokenRequest;
}

async function fetchSupplierDocumentWithBearerToken(
  path: string,
  accessToken: string,
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function fetchSupplierDocumentBlob(
  path: string,
): Promise<{ blob: Blob; fileName: string }> {
  let accessToken = getAccessToken();
  if (!accessToken) {
    accessToken = await refreshAccessTokenForDocumentDownload();
  }

  if (!accessToken) {
    throw new Error("Belgeyi görüntülemek için tekrar giriş yapmalısınız.");
  }

  let response = await fetchSupplierDocumentWithBearerToken(path, accessToken);

  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenForDocumentDownload();
    if (!refreshedToken) {
      throw new Error("Belgeyi görüntülemek için tekrar giriş yapmalısınız.");
    }

    response = await fetchSupplierDocumentWithBearerToken(path, refreshedToken);
  }

  if (!response.ok) {
    const responseText = await response.text();
    let payload: unknown = null;
    if (responseText) {
      try {
        payload = JSON.parse(responseText) as unknown;
      } catch {
        payload = null;
      }
    }

    throw new Error(resolveApiErrorMessage(payload));
  }

  return {
    blob: await response.blob(),
    fileName: resolveFileNameFromDisposition(
      response.headers.get("content-disposition"),
    ),
  };
}

export async function fetchSupplierApplicationDocumentForAdmin(
  applicationId: string,
  documentType: SupplierApplicationDocumentType,
): Promise<{ blob: Blob; fileName: string }> {
  return fetchSupplierDocumentBlob(
    `/supplier-applications/admin/${applicationId}/documents/${documentType}`,
  );
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.href = objectUrl;
  tempLink.download = fileName;
  tempLink.style.display = "none";
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export async function openSupplierApplicationDocumentForAdmin(
  applicationId: string,
  documentType: SupplierApplicationDocumentType,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const { blob, fileName } = await fetchSupplierApplicationDocumentForAdmin(
    applicationId,
    documentType,
  );
  const objectUrl = window.URL.createObjectURL(blob);
  const popupWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!popupWindow) {
    triggerBlobDownload(blob, fileName);
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export async function downloadSupplierApplicationDocumentForAdmin(
  applicationId: string,
  documentType: SupplierApplicationDocumentType,
  fallbackFileName?: string,
): Promise<void> {
  const { blob, fileName } = await fetchSupplierApplicationDocumentForAdmin(
    applicationId,
    documentType,
  );

  triggerBlobDownload(blob, fallbackFileName ?? fileName);
}
