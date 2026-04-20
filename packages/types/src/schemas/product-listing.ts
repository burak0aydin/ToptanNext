import { z } from 'zod';

const requiredFieldMessage = (fieldName: string) =>
  `${fieldName} alan bilgisi zorunlu bir alandır.`;

export const productListingStatusValues = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;

export const productListingStatusSchema = z
  .string()
  .min(1, requiredFieldMessage('Durum'))
  .refine((value) => {
    return productListingStatusValues.includes(
      value as (typeof productListingStatusValues)[number],
    );
  }, { message: 'Geçerli bir durum seçiniz.' });

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''));

const normalizeRichTextToPlainText = (value: string): string => {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export const productListingStepOneSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, requiredFieldMessage('Ürün Adı'))
      .max(255, 'Ürün adı en fazla 255 karakter olabilir.'),
    sku: z
      .string()
      .trim()
      .min(1, requiredFieldMessage('SKU'))
      .max(80, 'SKU en fazla 80 karakter olabilir.'),
    categoryId: z
      .string()
      .trim()
      .min(1, requiredFieldMessage('Alt-alt Kategori')),
    sectorIds: z
      .array(z.string().trim().min(1, 'Sektör bilgisi boş olamaz.'))
      .max(12, 'En fazla 12 sektör seçebilirsiniz.')
      .default([]),
    featuredFeatures: z
      .array(z.string().trim().min(1, 'Özellik alanı boş olamaz.').max(80, 'Her özellik en fazla 80 karakter olabilir.'))
      .max(12, 'En fazla 12 özellik ekleyebilirsiniz.')
      .default([]),
    isCustomizable: z.boolean().default(false),
    customizationNote: optionalTrimmedString,
    description: z
      .string()
      .trim()
      .max(20000, 'Ürün açıklaması biçimlendirmeyle birlikte en fazla 20000 karakter olabilir.')
      .refine((value) => normalizeRichTextToPlainText(value).length > 0, {
        message: requiredFieldMessage('Ürün Açıklaması'),
      })
      .refine((value) => normalizeRichTextToPlainText(value).length <= 5000, {
        message: 'Ürün açıklaması metin olarak en fazla 5000 karakter olabilir.',
      }),
  })
  .superRefine((value, context) => {
    if (value.isCustomizable && (!value.customizationNote || value.customizationNote.trim().length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customizationNote'],
        message: 'Ürün özelleştirilebiliyorsa açıklama girilmelidir.',
      });
    }
  });

export const productListingStepTwoSchema = z.object({
  basePrice: z.coerce
    .number()
    .min(0.01, 'Birim fiyat 0 değerinden büyük olmalıdır.'),
  currency: z
    .string()
    .trim()
    .min(3, 'Para birimi 3 karakter olmalıdır.')
    .max(3, 'Para birimi 3 karakter olmalıdır.')
    .default('TRY'),
  minOrderQuantity: z.coerce
    .number()
    .int('Minimum sipariş adedi tam sayı olmalıdır.')
    .min(1, 'Minimum sipariş adedi en az 1 olmalıdır.'),
  stock: z.coerce
    .number()
    .int('Stok tam sayı olmalıdır.')
    .min(0, 'Stok negatif olamaz.'),
});

export const productListingStepThreeSchema = z.object({
  leadTimeDays: z.coerce
    .number()
    .int('Tedarik süresi tam sayı olmalıdır.')
    .min(0, 'Tedarik süresi negatif olamaz.'),
  packageLengthCm: z.coerce
    .number()
    .min(0.01, 'Paket uzunluğu 0 değerinden büyük olmalıdır.'),
  packageWidthCm: z.coerce
    .number()
    .min(0.01, 'Paket genişliği 0 değerinden büyük olmalıdır.'),
  packageHeightCm: z.coerce
    .number()
    .min(0.01, 'Paket yüksekliği 0 değerinden büyük olmalıdır.'),
  packageWeightKg: z.coerce
    .number()
    .min(0.001, 'Paket ağırlığı 0 değerinden büyük olmalıdır.'),
});

export const productListingSubmitSchema = z.object({
  confirmSubmission: z
    .boolean()
    .refine((value) => value, {
      message: 'Ürünü onaya göndermek için onay vermelisiniz.',
    }),
});

export type ProductListingStatus =
  (typeof productListingStatusValues)[number];
export type ProductListingStepOneDto = z.infer<typeof productListingStepOneSchema>;
export type ProductListingStepTwoDto = z.infer<typeof productListingStepTwoSchema>;
export type ProductListingStepThreeDto = z.infer<typeof productListingStepThreeSchema>;
export type ProductListingSubmitDto = z.infer<typeof productListingSubmitSchema>;
