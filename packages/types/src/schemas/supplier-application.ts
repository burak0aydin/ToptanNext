import { z } from 'zod';

export const supplierCompanyTypeValues = ['SAHIS', 'LIMITED', 'ANONIM'] as const;

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
});

export type SupplierCompanyType = z.infer<typeof supplierCompanyTypeSchema>;
export type SupplierApplicationStepOneDto = z.infer<typeof supplierApplicationStepOneSchema>;
