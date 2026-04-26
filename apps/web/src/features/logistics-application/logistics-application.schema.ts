import { z } from 'zod';

export const logisticsAuthorizationDocumentTypeValues = [
  'K1',
  'K3',
  'R1',
  'R2',
  'L1',
  'DIGER',
] as const;

export const logisticsMainServiceTypeValues = [
  'PARSIYEL_TASIMA',
  'KOMPLE_ARAC_FTL',
  'SOGUK_ZINCIR',
  'KONTEYNER_GUMRUK',
  'AGIR_YUK',
  'DEPOLAMA',
] as const;

export const logisticsServiceRegionValues = [
  'TUM_TURKIYE',
  'BELIRLI_BOLGELER_SEHIRLER',
  'ULUSLARARASI',
] as const;

export const logisticsFleetCapacityValues = [
  '1-5',
  '6-20',
  '21-50',
  '50+',
] as const;

const requiredFieldMessage = (fieldName: string) => `${fieldName} alan bilgisi zorunlu bir alandır.`;

export const logisticsApplicationStepOneSchema = z.object({
  companyName: z.string().trim().min(1, requiredFieldMessage('Şirket Tam Adı')).max(160, 'Şirket tam adı en fazla 160 karakter olabilir.'),
  companyType: z.string().trim().min(1, requiredFieldMessage('Şirket Türü')).max(60, 'Şirket türü en fazla 60 karakter olabilir.'),
  vknOrTckn: z.string().trim().min(1, requiredFieldMessage('VKN / TCKN')).regex(/^\d{10,11}$/, 'VKN / TCKN alanı 10 veya 11 haneli olmalıdır.'),
  taxOffice: z.string().trim().min(1, requiredFieldMessage('Vergi Dairesi')).max(120, 'Vergi dairesi en fazla 120 karakter olabilir.'),
  mersisNo: z.string().trim().min(1, requiredFieldMessage('MERSİS No')).regex(/^\d{16}$/, 'MERSİS No alanı 16 haneli olmalıdır.'),
  tradeRegistryNo: z.string().trim().max(40, 'Ticaret Sicil No en fazla 40 karakter olabilir.').optional().or(z.literal('')),
  city: z.string().trim().min(1, requiredFieldMessage('İl')).max(80, 'İl en fazla 80 karakter olabilir.'),
  district: z.string().trim().min(1, requiredFieldMessage('İlçe')).max(80, 'İlçe en fazla 80 karakter olabilir.'),
  referenceCode: z.string().trim().max(60, 'Referans kodu en fazla 60 karakter olabilir.').optional().or(z.literal('')),
  logisticsAuthorizationDocumentType: z
    .union([z.enum(logisticsAuthorizationDocumentTypeValues), z.literal('')])
    .refine((value) => value !== '', {
      message: 'Geçerli bir lojistik yetki belge türü seçiniz.',
    }),
  mainServiceTypes: z.array(z.enum(logisticsMainServiceTypeValues)).min(1, 'En az bir ana hizmet tipi seçmelisiniz.'),
});

export const logisticsApplicationStepTwoSchema = z.object({
  companyIban: z.string().trim().min(1, requiredFieldMessage('Şirket IBAN')).max(34, 'Şirket IBAN en fazla 34 karakter olabilir.'),
  kepAddress: z.string().trim().min(1, requiredFieldMessage('KEP Adresi')).email('Geçerli bir KEP adresi giriniz.'),
  isEInvoiceTaxpayer: z.boolean(),
  businessPhone: z.string().trim().min(1, requiredFieldMessage('İş Telefonu')).max(30, 'İş telefonu en fazla 30 karakter olabilir.'),
  headquartersAddress: z.string().trim().min(1, requiredFieldMessage('Şirket Merkezi Adresi')).max(500, 'Şirket merkezi adresi en fazla 500 karakter olabilir.'),
  serviceRegions: z.array(z.enum(logisticsServiceRegionValues)).min(1, 'En az bir hizmet bölgesi seçmelisiniz.'),
  fleetCapacity: z
    .union([z.enum(logisticsFleetCapacityValues), z.literal('')])
    .refine((value) => value !== '', {
      message: requiredFieldMessage('Filo / Araç Kapasitesi'),
    }),
  contactFirstName: z.string().trim().min(1, requiredFieldMessage('Ad')).max(80, 'Ad en fazla 80 karakter olabilir.'),
  contactLastName: z.string().trim().min(1, requiredFieldMessage('Soyad')).max(80, 'Soyad en fazla 80 karakter olabilir.'),
  contactRole: z.string().trim().min(1, requiredFieldMessage('Görev')).max(120, 'Görev en fazla 120 karakter olabilir.'),
  contactPhone: z.string().trim().min(1, requiredFieldMessage('Cep Telefonu')).max(30, 'Cep telefonu en fazla 30 karakter olabilir.'),
  contactEmail: z.string().trim().min(1, requiredFieldMessage('E-Posta')).email('Geçerli bir e-posta adresi giriniz.'),
});

export const logisticsApplicationStepThreeSchema = z.object({
  approvedSupplierAgreement: z.boolean().refine((value) => value, {
    message: 'Lojistik partnerliği sözleşmesini onaylamalısınız.',
  }),
  approvedKvkkAgreement: z.boolean().refine((value) => value, {
    message: 'KVKK aydınlatma metnini onaylamalısınız.',
  }),
  approvedCommercialMessage: z.boolean(),
});

export type LogisticsApplicationAuthorizationDocumentType = (typeof logisticsAuthorizationDocumentTypeValues)[number];
export type LogisticsApplicationMainServiceType = (typeof logisticsMainServiceTypeValues)[number];
export type LogisticsApplicationServiceRegion = (typeof logisticsServiceRegionValues)[number];
export type LogisticsApplicationFleetCapacity = (typeof logisticsFleetCapacityValues)[number];
export type LogisticsApplicationStepOneDto = z.infer<typeof logisticsApplicationStepOneSchema>;
export type LogisticsApplicationStepTwoDto = z.infer<typeof logisticsApplicationStepTwoSchema>;
export type LogisticsApplicationStepThreeDto = z.infer<typeof logisticsApplicationStepThreeSchema>;
