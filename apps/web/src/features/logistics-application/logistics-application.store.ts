import type {
  LogisticsApplicationFleetCapacity,
  LogisticsApplicationAuthorizationDocumentType,
  LogisticsApplicationMainServiceType,
  LogisticsApplicationServiceRegion,
  LogisticsApplicationStepOneDto,
  LogisticsApplicationStepThreeDto,
  LogisticsApplicationStepTwoDto,
} from './logistics-application.schema';

export const LOGISTICS_APPLICATION_STORAGE_KEY = 'toptannext:logistics-application:v1';

export type LogisticsApplicationDocumentFieldKey =
  | 'taxCertificate'
  | 'signatureCircular'
  | 'tradeRegistryGazette'
  | 'activityCertificate'
  | 'transportLicense';

export type LogisticsApplicationStoredData = {
  stepOne?: LogisticsApplicationStepOneDto;
  stepTwo?: LogisticsApplicationStepTwoDto;
  stepThree?: LogisticsApplicationStepThreeDto;
  uploadedDocumentNames?: Partial<Record<LogisticsApplicationDocumentFieldKey, string>>;
  submittedAt?: string;
};

function readStorage(): LogisticsApplicationStoredData {
  if (typeof window === 'undefined') {
    return {};
  }

  const rawValue = window.localStorage.getItem(LOGISTICS_APPLICATION_STORAGE_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as LogisticsApplicationStoredData;
  } catch {
    return {};
  }
}

function writeStorage(data: LogisticsApplicationStoredData): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOGISTICS_APPLICATION_STORAGE_KEY, JSON.stringify(data));
}

export function getStoredLogisticsApplication(): LogisticsApplicationStoredData {
  return readStorage();
}

export function saveLogisticsApplicationStepOne(
  stepOne: LogisticsApplicationStepOneDto,
): LogisticsApplicationStoredData {
  const nextValue = {
    ...readStorage(),
    stepOne,
  };

  writeStorage(nextValue);
  return nextValue;
}

export function saveLogisticsApplicationStepTwo(
  stepTwo: LogisticsApplicationStepTwoDto,
): LogisticsApplicationStoredData {
  const nextValue = {
    ...readStorage(),
    stepTwo,
  };

  writeStorage(nextValue);
  return nextValue;
}

export function saveLogisticsApplicationStepThree(
  stepThree: LogisticsApplicationStepThreeDto,
  uploadedDocumentNames: Partial<Record<LogisticsApplicationDocumentFieldKey, string>>,
): LogisticsApplicationStoredData {
  const nextValue = {
    ...readStorage(),
    stepThree,
    uploadedDocumentNames,
    submittedAt: new Date().toISOString(),
  };

  writeStorage(nextValue);
  return nextValue;
}

export function clearLogisticsApplicationStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LOGISTICS_APPLICATION_STORAGE_KEY);
}

export function hasStoredStepOne(data: LogisticsApplicationStoredData): boolean {
  return Boolean(data.stepOne);
}

export function hasStoredStepTwo(data: LogisticsApplicationStoredData): boolean {
  return Boolean(data.stepTwo);
}

export function hasStoredStepThree(data: LogisticsApplicationStoredData): boolean {
  return Boolean(data.stepThree);
}

export function isLogisticsApplicationComplete(data: LogisticsApplicationStoredData): boolean {
  return hasStoredStepOne(data) && hasStoredStepTwo(data) && hasStoredStepThree(data);
}

export const logisticsMainServiceTypeLabels: Record<LogisticsApplicationMainServiceType, string> = {
  PARSIYEL_TASIMA: 'Parsiyel Taşıma',
  KOMPLE_ARAC_FTL: 'Komple Araç (FTL)',
  SOGUK_ZINCIR: 'Soğuk Zincir',
  KONTEYNER_GUMRUK: 'Konteyner/Gümrük',
  AGIR_YUK: 'Ağır Yük',
  DEPOLAMA: 'Depolama',
};

export const logisticsServiceRegionLabels: Record<LogisticsApplicationServiceRegion, string> = {
  TUM_TURKIYE: 'Tüm Türkiye',
  BELIRLI_BOLGELER_SEHIRLER: 'Belirli Bölgeler/Şehirler',
  ULUSLARARASI: 'Uluslararası',
};

export const logisticsFleetCapacityLabels: Record<LogisticsApplicationFleetCapacity, string> = {
  '1-5': '1-5 Araç',
  '6-20': '6-20 Araç',
  '21-50': '21-50 Araç',
  '50+': '50+ Araç',
};

export const logisticsAuthorizationDocumentTypeLabels: Record<LogisticsApplicationAuthorizationDocumentType, string> = {
  K1: 'K1',
  K3: 'K3',
  R1: 'R1',
  R2: 'R2',
  L1: 'L1',
  DIGER: 'Diğer',
};
