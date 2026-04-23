import { z } from 'zod';

const requiredFieldMessage = (fieldName: string) =>
  `${fieldName} alan bilgisi zorunlu bir alandır.`;

export const productListingStatusValues = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;

export const productListingPackageTypeValues = [
  'BOX',
  'PALLET',
  'SACK',
  'OTHER',
] as const;

export const productListingShippingTimeValues = [
  'ONE_TO_THREE_DAYS',
  'THREE_TO_FIVE_DAYS',
  'ONE_WEEK',
  'CUSTOM_PRODUCTION',
] as const;

export const productListingDeliveryMethodValues = [
  'CONTRACTED_CARGO',
  'FREIGHT_FORWARDER',
  'BUYER_PICKUP',
  'OWN_VEHICLE',
] as const;

export const productListingVariantDisplayTypeValues = ['image', 'text'] as const;

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

export const productListingVariantOptionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Seçenek etiketi boş bırakılamaz.')
    .max(80, 'Seçenek etiketi en fazla 80 karakter olabilir.'),
  imageUrl: z
    .string()
    .trim()
    .min(1, 'Görsel eşleştirmesi zorunludur.')
    .nullable()
    .default(null),
});

export const productListingVariantGroupSchema = z
  .object({
    groupName: z
      .string()
      .trim()
      .min(1, 'Varyant grup adı zorunludur.')
      .max(60, 'Varyant grup adı en fazla 60 karakter olabilir.'),
    displayType: z.enum(productListingVariantDisplayTypeValues, {
      message: 'Varyant görünüm tipi geçersiz.',
    }),
    options: z
      .array(productListingVariantOptionSchema)
      .min(1, 'En az 1 seçenek eklemelisiniz.')
      .max(30, 'Bir grup için en fazla 30 seçenek ekleyebilirsiniz.'),
  })
  .superRefine((value, context) => {
    const optionSet = new Set<string>();

    value.options.forEach((option, index) => {
      const normalizedLabel = option.label.trim().toLocaleLowerCase('tr-TR');
      if (optionSet.has(normalizedLabel)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', index, 'label'],
          message: 'Aynı grup içinde seçenek etiketleri benzersiz olmalıdır.',
        });
      }

      optionSet.add(normalizedLabel);

      if (value.displayType === 'image' && !option.imageUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', index, 'imageUrl'],
          message: 'Görsel tipinde her seçenek için galeri görseli seçmelisiniz.',
        });
      }
    });
  });

export const productListingFeaturedFeatureSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Özellik başlığı boş olamaz.')
    .max(80, 'Özellik başlığı en fazla 80 karakter olabilir.'),
  description: z
    .string()
    .trim()
    .min(1, 'Özellik açıklaması boş olamaz.')
    .max(140, 'Özellik açıklaması en fazla 140 karakter olabilir.'),
});

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
      .array(productListingFeaturedFeatureSchema)
      .default([]),
    isCustomizable: z.boolean().default(false),
    customizationNote: optionalTrimmedString,
    variantGroups: z
      .array(productListingVariantGroupSchema)
      .max(6, 'En fazla 6 varyant grubu ekleyebilirsiniz.')
      .default([]),
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

    const groupSet = new Set<string>();
    value.variantGroups.forEach((group, index) => {
      const normalizedName = group.groupName.trim().toLocaleLowerCase('tr-TR');
      if (groupSet.has(normalizedName)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variantGroups', index, 'groupName'],
          message: 'Varyant grup adları benzersiz olmalıdır.',
        });
      }

      groupSet.add(normalizedName);
    });
  });

export const productListingPricingTierSchema = z
  .object({
    minQuantity: z.coerce
      .number()
      .int('Kademe minimum adedi tam sayı olmalıdır.')
      .min(1, 'Kademe minimum adedi en az 1 olmalıdır.'),
    maxQuantity: z.coerce
      .number()
      .int('Kademe maksimum adedi tam sayı olmalıdır.')
      .min(1, 'Kademe maksimum adedi en az 1 olmalıdır.'),
    unitPrice: z.coerce
      .number()
      .min(0.01, 'Kademe birim fiyatı 0 değerinden büyük olmalıdır.'),
  })
  .superRefine((value, context) => {
    if (value.maxQuantity < value.minQuantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxQuantity'],
        message: 'Kademe maksimum adedi minimum adetten küçük olamaz.',
      });
    }
  });

const optionalPositiveIntegerSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return null;
  }

  return Number(value);
}, z
  .number()
  .int('Pazarlık eşiği tam sayı olmalıdır.')
  .min(1, 'Pazarlık eşiği en az 1 olmalıdır.')
  .nullable());

export const productListingStepTwoSchema = z.object({
  minOrderQuantity: z.coerce
    .number()
    .int('Minimum sipariş adedi tam sayı olmalıdır.')
    .min(1, 'Minimum sipariş adedi en az 1 olmalıdır.'),
  stock: z.coerce
    .number()
    .int('Stok tam sayı olmalıdır.')
    .min(0, 'Stok negatif olamaz.'),
  isNegotiationEnabled: z.boolean().default(false),
  negotiationThreshold: optionalPositiveIntegerSchema.default(null),
  pricingTiers: z
    .array(productListingPricingTierSchema)
    .min(1, 'En az 1 kademe tanımlamalısınız.')
    .max(6, 'En fazla 6 kademe tanımlayabilirsiniz.'),
}).superRefine((value, context) => {
  value.pricingTiers.forEach((currentTier, index) => {
    if (index === 0) {
      return;
    }

    const previousTier = value.pricingTiers[index - 1];
    if (currentTier.minQuantity <= previousTier.maxQuantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pricingTiers', index, 'minQuantity'],
        message: 'Kademe aralıkları çakışamaz; bir sonraki kademe bir öncekinin üstünden başlamalıdır.',
      });
    }
  });

  const minOrderCovered = value.pricingTiers.some((tier) => (
    value.minOrderQuantity >= tier.minQuantity && value.minOrderQuantity <= tier.maxQuantity
  ));

  if (!minOrderCovered) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['minOrderQuantity'],
      message: 'Minimum sipariş adedi, tanımlanan bir kademe aralığı içinde olmalıdır.',
    });
  }

  if (value.isNegotiationEnabled && value.negotiationThreshold === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['negotiationThreshold'],
      message: 'Pazarlık eşiği açıkken adet sınırı zorunludur.',
    });
  }
});

export const productListingStepThreeSchema = z.object({
  packageType: z.enum(productListingPackageTypeValues, {
    message: 'Geçerli bir paket tipi seçiniz.',
  }),
  leadTimeDays: z.coerce
    .number()
    .int('Tedarik süresi tam sayı olmalıdır.')
    .min(0, 'Tedarik süresi negatif olamaz.'),
  shippingTime: z.enum(productListingShippingTimeValues, {
    message: 'Geçerli bir kargoya verilme süresi seçiniz.',
  }),
  deliveryMethods: z
    .array(z.enum(productListingDeliveryMethodValues))
    .min(1, 'En az bir teslimat yöntemi seçmelisiniz.'),
  dynamicFreightAgreement: z.boolean().default(false),
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
export type ProductListingPackageType =
  (typeof productListingPackageTypeValues)[number];
export type ProductListingShippingTime =
  (typeof productListingShippingTimeValues)[number];
export type ProductListingDeliveryMethod =
  (typeof productListingDeliveryMethodValues)[number];
export type ProductListingVariantDisplayType =
  (typeof productListingVariantDisplayTypeValues)[number];
export type ProductListingVariantOption = z.infer<typeof productListingVariantOptionSchema>;
export type ProductListingVariantGroup = z.infer<typeof productListingVariantGroupSchema>;
export type ProductListingFeaturedFeature = z.infer<typeof productListingFeaturedFeatureSchema>;
export type ProductListingStepOneDto = z.infer<typeof productListingStepOneSchema>;
export type ProductListingStepTwoDto = z.infer<typeof productListingStepTwoSchema>;
export type ProductListingStepThreeDto = z.infer<typeof productListingStepThreeSchema>;
export type ProductListingSubmitDto = z.infer<typeof productListingSubmitSchema>;
