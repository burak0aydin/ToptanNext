import { requestJson } from '@/lib/api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-token';
import type {
  LogisticsApplicationFleetCapacity,
  LogisticsApplicationStepOneDto,
  LogisticsApplicationStepThreeDto,
  LogisticsApplicationStepTwoDto,
} from '../logistics-application.schema';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

let refreshDocumentTokenRequest: Promise<string | null> | null = null;

type LogisticsFleetCapacityApi =
  | 'ONE_TO_FIVE'
  | 'SIX_TO_TWENTY'
  | 'TWENTY_ONE_TO_FIFTY'
  | 'FIFTY_PLUS';

export type LogisticsApplicationDocumentType =
  | 'TAX_CERTIFICATE'
  | 'SIGNATURE_CIRCULAR'
  | 'TRADE_REGISTRY_GAZETTE'
  | 'ACTIVITY_CERTIFICATE'
  | 'TRANSPORT_LICENSE';

const fleetCapacityToApiMap: Record<
  LogisticsApplicationFleetCapacity,
  LogisticsFleetCapacityApi
> = {
  '1-5': 'ONE_TO_FIVE',
  '6-20': 'SIX_TO_TWENTY',
  '21-50': 'TWENTY_ONE_TO_FIFTY',
  '50+': 'FIFTY_PLUS',
};

const fleetCapacityFromApiMap: Record<
  LogisticsFleetCapacityApi,
  LogisticsApplicationFleetCapacity
> = {
  ONE_TO_FIVE: '1-5',
  SIX_TO_TWENTY: '6-20',
  TWENTY_ONE_TO_FIFTY: '21-50',
  FIFTY_PLUS: '50+',
};

export type LogisticsApplicationDocumentRecord = {
  id: string;
  documentType: LogisticsApplicationDocumentType;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};

type LogisticsApplicationApiRecord = {
  id: string;
  userId: string;
  companyName: string;
  companyType: 'SAHIS' | 'LIMITED' | 'ANONIM';
  vknOrTckn: string;
  taxOffice: string;
  mersisNo: string;
  tradeRegistryNo: string | null;
  city: string;
  district: string;
  referenceCode: string | null;
  logisticsAuthorizationDocumentType: 'K1' | 'K3' | 'R1' | 'R2' | 'L1' | 'DIGER';
  mainServiceTypes: Array<
    | 'PARSIYEL_TASIMA'
    | 'KOMPLE_ARAC_FTL'
    | 'SOGUK_ZINCIR'
    | 'KONTEYNER_GUMRUK'
    | 'AGIR_YUK'
    | 'DEPOLAMA'
  >;
  companyIban: string | null;
  kepAddress: string | null;
  isEInvoiceTaxpayer: boolean | null;
  businessPhone: string | null;
  headquartersAddress: string | null;
  serviceRegions: Array<
    'TUM_TURKIYE' | 'BELIRLI_BOLGELER_SEHIRLER' | 'ULUSLARARASI'
  >;
  fleetCapacity: LogisticsFleetCapacityApi | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactRole: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  reviewedAt: string | null;
  approvedSupplierAgreement: boolean;
  approvedKvkkAgreement: boolean;
  approvedCommercialMessage: boolean;
  documents: LogisticsApplicationDocumentRecord[];
  createdAt: string;
  updatedAt: string;
};

export type LogisticsApplicationRecord = Omit<
  LogisticsApplicationApiRecord,
  'fleetCapacity'
> & {
  fleetCapacity: LogisticsApplicationFleetCapacity | null;
};

type LogisticsApplicationAdminListItemApi = {
  id: string;
  userId: string;
  companyName: string;
  companyType: 'SAHIS' | 'LIMITED' | 'ANONIM';
  vknOrTckn: string;
  logisticsAuthorizationDocumentType: 'K1' | 'K3' | 'R1' | 'R2' | 'L1' | 'DIGER';
  mainServiceTypes: Array<
    | 'PARSIYEL_TASIMA'
    | 'KOMPLE_ARAC_FTL'
    | 'SOGUK_ZINCIR'
    | 'KONTEYNER_GUMRUK'
    | 'AGIR_YUK'
    | 'DEPOLAMA'
  >;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  contactEmail: string | null;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type LogisticsApplicationAdminListItem = Omit<
  LogisticsApplicationAdminListItemApi,
  'fleetCapacity'
>;

export type UpsertLogisticsDocumentsPayload = LogisticsApplicationStepThreeDto & {
  taxCertificate?: File | null;
  signatureCircular?: File | null;
  tradeRegistryGazette?: File | null;
  activityCertificate?: File | null;
  transportLicense?: File | null;
};

export type ReviewLogisticsApplicationPayload = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
};

function mapApiRecord(
  application: LogisticsApplicationApiRecord,
): LogisticsApplicationRecord {
  return {
    ...application,
    fleetCapacity: application.fleetCapacity
      ? fleetCapacityFromApiMap[application.fleetCapacity]
      : null,
  };
}

export async function fetchMyLogisticsApplication(): Promise<LogisticsApplicationRecord | null> {
  const data = await requestJson<LogisticsApplicationApiRecord | null>(
    '/logistics-applications/me',
    {
      auth: true,
    },
  );

  return data ? mapApiRecord(data) : null;
}

export async function upsertMyLogisticsApplication(
  payload: LogisticsApplicationStepOneDto,
): Promise<LogisticsApplicationRecord> {
  const data = await requestJson<
    LogisticsApplicationApiRecord,
    LogisticsApplicationStepOneDto
  >('/logistics-applications/me', {
    method: 'PUT',
    auth: true,
    body: payload,
  });

  return mapApiRecord(data);
}

export async function upsertMyLogisticsContactFinance(
  payload: LogisticsApplicationStepTwoDto,
): Promise<LogisticsApplicationRecord> {
  if (!payload.fleetCapacity) {
    throw new Error('Filo / Araç Kapasitesi alanı zorunludur.');
  }

  const data = await requestJson<
    LogisticsApplicationApiRecord,
    Omit<LogisticsApplicationStepTwoDto, 'fleetCapacity'> & {
      fleetCapacity: LogisticsFleetCapacityApi;
    }
  >('/logistics-applications/me/contact-finance', {
    method: 'PUT',
    auth: true,
    body: {
      ...payload,
      fleetCapacity: fleetCapacityToApiMap[payload.fleetCapacity],
    },
  });

  return mapApiRecord(data);
}

export async function upsertMyLogisticsDocuments(
  payload: UpsertLogisticsDocumentsPayload,
): Promise<LogisticsApplicationRecord> {
  const formData = new FormData();
  formData.append(
    'approvedSupplierAgreement',
    String(payload.approvedSupplierAgreement),
  );
  formData.append('approvedKvkkAgreement', String(payload.approvedKvkkAgreement));
  formData.append(
    'approvedCommercialMessage',
    String(payload.approvedCommercialMessage),
  );

  if (payload.taxCertificate) {
    formData.append('taxCertificate', payload.taxCertificate);
  }
  if (payload.signatureCircular) {
    formData.append('signatureCircular', payload.signatureCircular);
  }
  if (payload.tradeRegistryGazette) {
    formData.append('tradeRegistryGazette', payload.tradeRegistryGazette);
  }
  if (payload.activityCertificate) {
    formData.append('activityCertificate', payload.activityCertificate);
  }
  if (payload.transportLicense) {
    formData.append('transportLicense', payload.transportLicense);
  }

  try {
    const data = await requestJson<LogisticsApplicationApiRecord, FormData>(
      '/logistics-applications/me/documents',
      {
        method: 'PUT',
        auth: true,
        body: formData,
      },
    );

    return mapApiRecord(data);
  } catch (error) {
    if (error instanceof Error && /file too large/i.test(error.message)) {
      throw new Error('Yüklenen dosya 15 MB sınırını aşıyor.');
    }

    throw error;
  }
}

export async function fetchLogisticsApplicationsForAdmin(): Promise<
  LogisticsApplicationAdminListItem[]
> {
  return requestJson<LogisticsApplicationAdminListItemApi[]>(
    '/logistics-applications/admin',
    {
      auth: true,
    },
  );
}

export async function fetchLogisticsApplicationByIdForAdmin(
  id: string,
): Promise<LogisticsApplicationRecord> {
  const data = await requestJson<LogisticsApplicationApiRecord>(
    `/logistics-applications/admin/${id}`,
    {
      auth: true,
    },
  );

  return mapApiRecord(data);
}

export async function reviewLogisticsApplicationByAdmin(
  id: string,
  payload: ReviewLogisticsApplicationPayload,
): Promise<LogisticsApplicationRecord> {
  const data = await requestJson<
    LogisticsApplicationApiRecord,
    ReviewLogisticsApplicationPayload
  >(`/logistics-applications/admin/${id}/review`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });

  return mapApiRecord(data);
}

function resolveApiErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Belge alınırken bir sorun oluştu.';
  }

  const maybeError = payload as {
    error?: { message?: string };
    message?: string | string[];
  };

  if (
    typeof maybeError.error?.message === 'string' &&
    maybeError.error.message.length > 0
  ) {
    return maybeError.error.message;
  }

  if (typeof maybeError.message === 'string' && maybeError.message.length > 0) {
    return maybeError.message;
  }

  if (Array.isArray(maybeError.message) && maybeError.message.length > 0) {
    return maybeError.message.join(' ');
  }

  return 'Belge alınırken bir sorun oluştu.';
}

function resolveFileNameFromDisposition(disposition: string | null): string {
  if (!disposition) {
    return 'belge';
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) {
    return decodeURIComponent(basicMatch[1]);
  }

  return 'belge';
}

async function refreshAccessTokenForDocumentDownload(): Promise<string | null> {
  if (refreshDocumentTokenRequest) {
    return refreshDocumentTokenRequest;
  }

  refreshDocumentTokenRequest = (async () => {
    try {
      const payload = await requestJson<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
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

async function fetchLogisticsDocumentWithBearerToken(
  path: string,
  accessToken: string,
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function fetchLogisticsDocumentBlob(
  path: string,
): Promise<{ blob: Blob; fileName: string }> {
  let accessToken = getAccessToken();
  if (!accessToken) {
    accessToken = await refreshAccessTokenForDocumentDownload();
  }

  if (!accessToken) {
    throw new Error('Belgeyi görüntülemek için tekrar giriş yapmalısınız.');
  }

  let response = await fetchLogisticsDocumentWithBearerToken(path, accessToken);

  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenForDocumentDownload();
    if (!refreshedToken) {
      throw new Error('Belgeyi görüntülemek için tekrar giriş yapmalısınız.');
    }

    response = await fetchLogisticsDocumentWithBearerToken(path, refreshedToken);
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
      response.headers.get('content-disposition'),
    ),
  };
}

export async function fetchLogisticsApplicationDocumentForAdmin(
  applicationId: string,
  documentType: LogisticsApplicationDocumentType,
): Promise<{ blob: Blob; fileName: string }> {
  return fetchLogisticsDocumentBlob(
    `/logistics-applications/admin/${applicationId}/documents/${documentType}`,
  );
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = objectUrl;
  tempLink.download = fileName;
  tempLink.style.display = 'none';
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export async function openLogisticsApplicationDocumentForAdmin(
  applicationId: string,
  documentType: LogisticsApplicationDocumentType,
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const { blob, fileName } = await fetchLogisticsApplicationDocumentForAdmin(
    applicationId,
    documentType,
  );
  const objectUrl = window.URL.createObjectURL(blob);
  const popupWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');

  if (!popupWindow) {
    triggerBlobDownload(blob, fileName);
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export async function downloadLogisticsApplicationDocumentForAdmin(
  applicationId: string,
  documentType: LogisticsApplicationDocumentType,
  fallbackFileName?: string,
): Promise<void> {
  const { blob, fileName } = await fetchLogisticsApplicationDocumentForAdmin(
    applicationId,
    documentType,
  );

  triggerBlobDownload(blob, fallbackFileName ?? fileName);
}
