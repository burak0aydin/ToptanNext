import { z } from 'zod';

export const supplierCompanyTypeValues = ['SAHIS', 'LIMITED', 'ANONIM'] as const;

export const supplierApplicationReviewStatusValues = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export const supplierApplicationDocumentTypeValues = [
  'TAX_CERTIFICATE',
  'SIGNATURE_CIRCULAR',
  'TRADE_REGISTRY_GAZETTE',
  'ACTIVITY_CERTIFICATE',
] as const;

export const supplierCompanyTypeSchema = z
  .string()
  .min(1, 'Şirket Türü alan bilgisi zorunlu bir alandır.')
  .refine((value) => {
    return supplierCompanyTypeValues.includes(
      value as (typeof supplierCompanyTypeValues)[number],
    );
  }, { message: 'Geçerli bir şirket türü seçiniz.' });

const requiredFieldMessage = (fieldName: string) => `${fieldName} alan bilgisi zorunlu bir alandır.`;

export const supplierApplicationStepOneSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Şirket Tam Adı'))
    .max(160, 'Şirket tam adı en fazla 160 karakter olabilir.'),
  companyType: supplierCompanyTypeSchema,
  vknOrTckn: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('VKN / TCKN'))
    .regex(/^\d{10,11}$/, 'VKN / TCKN alanı 10 veya 11 haneli olmalıdır.'),
  taxOffice: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Vergi Dairesi'))
    .max(120, 'Vergi dairesi en fazla 120 karakter olabilir.'),
  mersisNo: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('MERSİS No'))
    .regex(/^\d{16}$/, 'MERSİS No alanı 16 haneli olmalıdır.'),
  tradeRegistryNo: z
    .string()
    .trim()
    .max(40, 'Ticaret Sicil No en fazla 40 karakter olabilir.')
    .optional()
    .or(z.literal('')),
  activitySector: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Faaliyet Alanı'))
    .max(120, 'Faaliyet alanı en fazla 120 karakter olabilir.'),
  city: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('İl'))
    .max(80, 'İl en fazla 80 karakter olabilir.'),
  district: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('İlçe'))
    .max(80, 'İlçe en fazla 80 karakter olabilir.'),
  referenceCode: z
    .string()
    .trim()
    .max(60, 'Referans kodu en fazla 60 karakter olabilir.')
    .optional()
    .or(z.literal('')),
});

export const supplierApplicationStepTwoSchema = z.object({
  companyIban: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Şirket IBAN'))
    .max(34, 'Şirket IBAN en fazla 34 karakter olabilir.'),
  kepAddress: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('KEP Adresi'))
    .email('Geçerli bir KEP adresi giriniz.'),
  isEInvoiceTaxpayer: z.boolean(),
  businessPhone: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('İş Telefonu'))
    .max(30, 'İş telefonu en fazla 30 karakter olabilir.'),
  headquartersAddress: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Şirket Merkezi Adresi'))
    .max(500, 'Şirket merkezi adresi en fazla 500 karakter olabilir.'),
  warehouseSameAsHeadquarters: z.boolean(),
  warehouseAddress: z
    .string()
    .trim()
    .max(500, 'Sevkiyat/iade depo adresi en fazla 500 karakter olabilir.'),
  contactFirstName: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Ad'))
    .max(80, 'Ad en fazla 80 karakter olabilir.'),
  contactLastName: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Soyad'))
    .max(80, 'Soyad en fazla 80 karakter olabilir.'),
  contactRole: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Görev'))
    .max(120, 'Görev en fazla 120 karakter olabilir.'),
  contactPhone: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('Cep Telefonu'))
    .max(30, 'Cep telefonu en fazla 30 karakter olabilir.'),
  contactEmail: z
    .string()
    .trim()
    .min(1, requiredFieldMessage('E-Posta'))
    .email('Geçerli bir e-posta adresi giriniz.'),
}).superRefine((value, context) => {
  if (!value.warehouseSameAsHeadquarters && value.warehouseAddress.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['warehouseAddress'],
      message: 'Sevkiyat / İade Depo Adresi alan bilgisi zorunlu bir alandır.',
    });
  }
});

export const supplierApplicationStepThreeSchema = z.object({
  approvedSupplierAgreement: z
    .boolean()
    .refine((value) => value, {
      message: 'Tedarikçi iş ortaklığı sözleşmesini onaylamalısınız.',
    }),
  approvedKvkkAgreement: z
    .boolean()
    .refine((value) => value, {
      message: 'KVKK aydınlatma metnini onaylamalısınız.',
    }),
  approvedCommercialMessage: z.boolean(),
});

export type SupplierCompanyType = z.infer<typeof supplierCompanyTypeSchema>;
export type SupplierApplicationStepOneDto = z.infer<typeof supplierApplicationStepOneSchema>;
export type SupplierApplicationReviewStatus =
  (typeof supplierApplicationReviewStatusValues)[number];
export type SupplierApplicationStepTwoDto = z.infer<typeof supplierApplicationStepTwoSchema>;
export type SupplierApplicationDocumentType =
  (typeof supplierApplicationDocumentTypeValues)[number];
export type SupplierApplicationStepThreeDto =
  z.infer<typeof supplierApplicationStepThreeSchema>;
