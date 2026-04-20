'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  productListingStepOneSchema,
  productListingStepThreeSchema,
  productListingStepTwoSchema,
  type ProductListingStepOneDto,
  type ProductListingStepThreeDto,
  type ProductListingStepTwoDto,
} from '@toptannext/types';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import {
  createProductListingStepOne,
  fetchCategoriesTree,
  fetchSectors,
  submitProductListing,
  updateProductListingStepThree,
  updateProductListingStepTwo,
  uploadProductListingMedia,
  type CategoryTreeNode,
  type ProductListingRecord,
  type SectorRecord,
} from '@/features/product-listing/api/product-listing.api';
import { RichTextEditor } from '@/features/product-listing/components/RichTextEditor';

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Array<{ title: string; subtitle: string }> = [
  { title: '1', subtitle: 'Temel Bilgiler' },
  { title: '2', subtitle: 'Fiyatlandırma & Stok' },
  { title: '3', subtitle: 'Lojistik' },
];

const STEP_ONE_DEFAULT_VALUES: ProductListingStepOneDto = {
  name: '',
  sku: '',
  categoryId: '',
  sectorIds: [],
  featuredFeatures: [],
  isCustomizable: false,
  customizationNote: '',
  description: '',
};

const STEP_TWO_DEFAULT_VALUES: ProductListingStepTwoDto = {
  basePrice: 0,
  currency: 'TRY',
  minOrderQuantity: 1,
  stock: 0,
};

const STEP_THREE_DEFAULT_VALUES: ProductListingStepThreeDto = {
  leadTimeDays: 0,
  packageLengthCm: 0,
  packageWidthCm: 0,
  packageHeightCm: 0,
  packageWeightKg: 0,
};

function findCategoryPath(
  categoryTree: CategoryTreeNode[],
  leafCategoryId: string,
): { mainId: string; subId: string; leafId: string; breadcrumb: string } | null {
  for (const main of categoryTree) {
    for (const sub of main.children) {
      for (const leaf of sub.children) {
        if (leaf.id === leafCategoryId) {
          return {
            mainId: main.id,
            subId: sub.id,
            leafId: leaf.id,
            breadcrumb: `${main.name} > ${sub.name} > ${leaf.name}`,
          };
        }
      }
    }
  }

  return null;
}

export default function SellerProductUploadPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [draftRecord, setDraftRecord] = useState<ProductListingRecord | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [sectors, setSectors] = useState<SectorRecord[]>([]);
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [sectorInput, setSectorInput] = useState('');
  const [uploadedMediaFiles, setUploadedMediaFiles] = useState<File[]>([]);
  const [submitConfirmed, setSubmitConfirmed] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const stepOneForm = useForm<ProductListingStepOneDto>({
    resolver: zodResolver(
      productListingStepOneSchema,
    ) as Resolver<ProductListingStepOneDto>,
    defaultValues: STEP_ONE_DEFAULT_VALUES,
  });

  const stepTwoForm = useForm<ProductListingStepTwoDto>({
    resolver: zodResolver(
      productListingStepTwoSchema,
    ) as Resolver<ProductListingStepTwoDto>,
    defaultValues: STEP_TWO_DEFAULT_VALUES,
  });

  const stepThreeForm = useForm<ProductListingStepThreeDto>({
    resolver: zodResolver(
      productListingStepThreeSchema,
    ) as Resolver<ProductListingStepThreeDto>,
    defaultValues: STEP_THREE_DEFAULT_VALUES,
  });

  const selectedMainCategory = useMemo(
    () => categoryTree.find((item) => item.id === mainCategoryId) ?? null,
    [categoryTree, mainCategoryId],
  );

  const selectedSubCategory = useMemo(
    () => selectedMainCategory?.children.find((item) => item.id === subCategoryId) ?? null,
    [selectedMainCategory, subCategoryId],
  );

  const leafCategories = selectedSubCategory?.children ?? [];

  const watchedStepOne = stepOneForm.watch();
  const watchedStepTwo = stepTwoForm.watch();
  const watchedStepThree = stepThreeForm.watch();

  useEffect(() => {
    let isMounted = true;

    const loadMeta = async () => {
      try {
        setIsLoadingMeta(true);
        setGlobalError(null);

        const [categoryResponse, sectorsResponse] = await Promise.all([
          fetchCategoriesTree(),
          fetchSectors(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategoryTree(categoryResponse);
        setSectors(sectorsResponse);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setGlobalError(
          error instanceof Error
            ? error.message
            : 'Form bilgileri yüklenirken bir sorun oluştu.',
        );
      } finally {
        if (isMounted) {
          setIsLoadingMeta(false);
        }
      }
    };

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCategoryPath = useMemo(() => {
    const categoryId = watchedStepOne.categoryId || draftRecord?.categoryId;
    if (!categoryId) {
      return null;
    }

    return findCategoryPath(categoryTree, categoryId);
  }, [categoryTree, draftRecord?.categoryId, watchedStepOne.categoryId]);

  const summaryCategoryText = useMemo(() => {
    if (!activeCategoryPath) {
      return 'Seçilmedi';
    }

    return activeCategoryPath.breadcrumb;
  }, [activeCategoryPath]);

  useEffect(() => {
    if (!activeCategoryPath) {
      return;
    }

    if (!mainCategoryId) {
      setMainCategoryId(activeCategoryPath.mainId);
    }

    if (!subCategoryId) {
      setSubCategoryId(activeCategoryPath.subId);
    }
  }, [activeCategoryPath, mainCategoryId, subCategoryId]);

  const addFeaturedFeature = (): void => {
    const nextValue = featureInput.trim();
    if (nextValue.length === 0) {
      return;
    }

    const current = stepOneForm.getValues('featuredFeatures') ?? [];
    if (current.includes(nextValue)) {
      setFeatureInput('');
      return;
    }

    stepOneForm.setValue('featuredFeatures', [...current, nextValue], {
      shouldValidate: true,
      shouldDirty: true,
    });
    setFeatureInput('');
  };

  const removeFeature = (feature: string): void => {
    const current = stepOneForm.getValues('featuredFeatures') ?? [];
    stepOneForm.setValue(
      'featuredFeatures',
      current.filter((item) => item !== feature),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const addSector = (sectorId: string): void => {
    if (!sectorId) {
      return;
    }

    const current = stepOneForm.getValues('sectorIds') ?? [];
    if (current.includes(sectorId)) {
      setSectorInput('');
      return;
    }

    stepOneForm.setValue('sectorIds', [...current, sectorId], {
      shouldValidate: true,
      shouldDirty: true,
    });
    setSectorInput('');
  };

  const removeSector = (sectorId: string): void => {
    const current = stepOneForm.getValues('sectorIds') ?? [];
    stepOneForm.setValue(
      'sectorIds',
      current.filter((item) => item !== sectorId),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const handleMediaSelection = (files: FileList | null): void => {
    if (!files) {
      return;
    }

    const nextFiles = Array.from(files);
    const existingCount = draftRecord?.media.length ?? 0;
    const total = existingCount + uploadedMediaFiles.length + nextFiles.length;

    if (total > 5) {
      setGlobalError('Bir ürün için en fazla 5 görsel veya video yükleyebilirsiniz.');
      return;
    }

    setGlobalError(null);
    setUploadedMediaFiles((prev) => [...prev, ...nextFiles]);
  };

  const removePendingMediaAt = (index: number): void => {
    setUploadedMediaFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const onSubmitStepOne = stepOneForm.handleSubmit(async (values) => {
    try {
      setIsSubmittingStep(true);
      setGlobalError(null);
      setSuccessMessage(null);

      const saved = await createProductListingStepOne(values);
      setDraftRecord(saved);

      if (saved.categoryId) {
        const categoryPath = findCategoryPath(categoryTree, saved.categoryId);
        if (categoryPath) {
          setMainCategoryId(categoryPath.mainId);
          setSubCategoryId(categoryPath.subId);
        }
      }

      setCurrentStep(2);
      setSuccessMessage('Temel ürün bilgileri kaydedildi. Şimdi fiyatlandırma adımını tamamlayın.');
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : 'Temel ürün bilgileri kaydedilemedi.',
      );
    } finally {
      setIsSubmittingStep(false);
    }
  });

  const onSubmitStepTwo = stepTwoForm.handleSubmit(async (values) => {
    if (!draftRecord?.id) {
      setGlobalError('Önce temel ürün bilgilerini kaydetmelisiniz.');
      return;
    }

    try {
      setIsSubmittingStep(true);
      setGlobalError(null);
      setSuccessMessage(null);

      const saved = await updateProductListingStepTwo(draftRecord.id, {
        ...values,
        currency: values.currency.toUpperCase(),
      });

      setDraftRecord(saved);
      setCurrentStep(3);
      setSuccessMessage('Fiyatlandırma ve stok bilgileri kaydedildi. Lojistik adımına geçildi.');
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : 'Fiyatlandırma ve stok bilgileri kaydedilemedi.',
      );
    } finally {
      setIsSubmittingStep(false);
    }
  });

  const onSubmitStepThree = stepThreeForm.handleSubmit(async (values) => {
    if (!draftRecord?.id) {
      setGlobalError('Önce temel ürün bilgilerini kaydetmelisiniz.');
      return;
    }

    if (!submitConfirmed) {
      setGlobalError('Ürünü onaya göndermek için onay kutusunu işaretlemelisiniz.');
      return;
    }

    try {
      setIsSubmittingStep(true);
      setGlobalError(null);
      setSuccessMessage(null);

      const stepThreeSaved = await updateProductListingStepThree(draftRecord.id, values);

      let afterMedia = stepThreeSaved;
      if (uploadedMediaFiles.length > 0) {
        afterMedia = await uploadProductListingMedia(draftRecord.id, uploadedMediaFiles);
        setUploadedMediaFiles([]);
      }

      const submitted = await submitProductListing(draftRecord.id, {
        confirmSubmission: true,
      });

      setDraftRecord(submitted);
      setIsCompleted(true);
      setSuccessMessage('Ürün başarıyla onaya gönderildi. Admin değerlendirmesi sonrasında listelenecektir.');

      if (!submitted.media.length && afterMedia.media.length > 0) {
        setDraftRecord(afterMedia);
      }
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Ürün onaya gönderilirken bir sorun oluştu.',
      );
    } finally {
      setIsSubmittingStep(false);
    }
  });

  const activeStepProgressWidth = `${(currentStep / 3) * 100}%`;

  const selectedSectorIds = watchedStepOne.sectorIds ?? [];
  const selectedSectors = sectors.filter((sector) =>
    selectedSectorIds.includes(sector.id),
  );

  const summaryName =
    watchedStepOne.name.trim().length > 0
      ? watchedStepOne.name.trim()
      : draftRecord?.name ?? 'Henüz belirtilmedi';

  const totalMediaCount = (draftRecord?.media.length ?? 0) + uploadedMediaFiles.length;

  return (
    <div className='space-y-8'>
      <header className='space-y-3'>
        <h2 className='text-2xl font-bold tracking-tight text-on-surface'>Ürün Yükle</h2>
        <p className='text-sm text-on-surface-variant'>
          Ürününüzü 3 adımda ekleyin ve onay sürecine gönderin.
        </p>
      </header>

      <section className='rounded-2xl border border-outline-variant/50 bg-surface p-5 md:p-8'>
        <div className='relative mx-auto max-w-4xl'>
          <div className='absolute left-0 right-0 top-5 h-0.5 bg-surface-container-highest' />
          <div
            className='absolute left-0 top-5 h-0.5 bg-primary transition-all duration-300'
            style={{ width: activeStepProgressWidth }}
          />

          <div className='relative z-10 grid grid-cols-3 gap-4'>
            {STEP_LABELS.map((step, index) => {
              const stepNumber = (index + 1) as WizardStep;
              const isActive = currentStep === stepNumber;
              const isCompletedStep = currentStep > stepNumber;

              return (
                <div key={step.subtitle} className='flex flex-col items-center gap-2 text-center'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isActive || isCompletedStep
                        ? 'bg-primary text-on-primary ring-4 ring-primary-fixed/70'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {step.title}
                  </div>
                  <p
                    className={`text-[11px] md:text-xs ${
                      isActive || isCompletedStep
                        ? 'font-semibold text-primary'
                        : 'font-medium text-on-surface-variant'
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {globalError ? (
        <p className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {globalError}
        </p>
      ) : null}

      {successMessage ? (
        <p className='rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'>
          {successMessage}
        </p>
      ) : null}

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        <div className='space-y-6 lg:col-span-8'>
          <section className='rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm md:p-8'>
            {currentStep === 1 ? (
              <>
                <div className='mb-6 flex items-center gap-2'>
                  <span className='material-symbols-outlined text-primary'>description</span>
                  <h3 className='text-xl font-bold tracking-tight text-on-surface'>Temel Ürün Bilgileri</h3>
                </div>

                <form className='grid grid-cols-1 gap-6 md:grid-cols-2' onSubmit={onSubmitStepOne}>
                  <label className='md:col-span-2'>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Ürün Adı</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      placeholder='Örn: Pamuklu Erkek Gömlek - Toptan'
                      type='text'
                      {...stepOneForm.register('name')}
                    />
                    {stepOneForm.formState.errors.name ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepOneForm.formState.errors.name.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>SKU</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      placeholder='Örn: TN-URUN-1001'
                      type='text'
                      {...stepOneForm.register('sku')}
                    />
                    {stepOneForm.formState.errors.sku ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepOneForm.formState.errors.sku.message}
                      </p>
                    ) : null}
                  </label>

                  <div className='md:col-span-2'>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                      <div>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Ana kategori</span>
                        <div className='relative'>
                          <select
                            className='w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                            value={mainCategoryId}
                            onChange={(event) => {
                              setMainCategoryId(event.target.value);
                              setSubCategoryId('');
                              stepOneForm.setValue('categoryId', '', { shouldValidate: true });
                            }}
                            disabled={isLoadingMeta || isSubmittingStep}
                          >
                            <option value=''>Ana kategori seçiniz</option>
                            {categoryTree.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400'>
                            expand_more
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Alt kategori</span>
                        <div className='relative'>
                          <select
                            className='w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                            value={subCategoryId}
                            onChange={(event) => {
                              setSubCategoryId(event.target.value);
                              stepOneForm.setValue('categoryId', '', { shouldValidate: true });
                            }}
                            disabled={!selectedMainCategory || isSubmittingStep}
                          >
                            <option value=''>Alt kategori seçiniz</option>
                            {(selectedMainCategory?.children ?? []).map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400'>
                            expand_more
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>En Alt Kategori</span>
                        <div className='relative'>
                          <select
                            className='w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                            value={watchedStepOne.categoryId}
                            onChange={(event) => {
                              stepOneForm.setValue('categoryId', event.target.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            disabled={!selectedSubCategory || isSubmittingStep}
                          >
                            <option value=''>En Alt Kategori seçiniz</option>
                            {leafCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400'>
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {stepOneForm.formState.errors.categoryId ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepOneForm.formState.errors.categoryId.message}
                      </p>
                    ) : null}
                  </div>

                  <div className='md:col-span-2'>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Ürün Sektörleri</span>
                    <div className='rounded-lg border border-outline-variant bg-surface-container-low p-4'>
                      <div className='mb-3 flex flex-wrap gap-2'>
                        {selectedSectors.length === 0 ? (
                          <p className='text-xs text-on-surface-variant'>Henüz sektör seçilmedi.</p>
                        ) : (
                          selectedSectors.map((sector) => (
                            <span
                              key={sector.id}
                              className='inline-flex items-center gap-1 rounded bg-primary-fixed px-2 py-1 text-xs font-medium text-primary'
                            >
                              {sector.name}
                              <button
                                className='inline-flex items-center'
                                onClick={() => removeSector(sector.id)}
                                type='button'
                              >
                                <span className='material-symbols-outlined text-sm'>close</span>
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className='grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]'>
                        <select
                          className='w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                          value={sectorInput}
                          onChange={(event) => setSectorInput(event.target.value)}
                          disabled={isSubmittingStep}
                        >
                          <option value=''>Sektör ekle...</option>
                          {sectors.map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className='rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                          onClick={() => addSector(sectorInput)}
                          type='button'
                          disabled={!sectorInput || isSubmittingStep}
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='md:col-span-2'>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Öne Çıkan Özellikler</span>
                    <div className='rounded-lg border border-outline-variant bg-surface-container-low p-2'>
                      <div className='mb-2 flex flex-wrap gap-2'>
                        {(watchedStepOne.featuredFeatures ?? []).map((feature) => (
                          <span
                            key={feature}
                            className='inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-medium text-on-surface'
                          >
                            {feature}
                            <button
                              className='inline-flex items-center text-slate-500 hover:text-red-600'
                              onClick={() => removeFeature(feature)}
                              type='button'
                            >
                              <span className='material-symbols-outlined text-sm'>close</span>
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className='grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]'>
                        <input
                          className='w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                          placeholder='Örn: %100 Pamuk'
                          type='text'
                          value={featureInput}
                          onChange={(event) => setFeatureInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ',') {
                              event.preventDefault();
                              addFeaturedFeature();
                            }
                          }}
                          disabled={isSubmittingStep}
                        />
                        <button
                          className='rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                          onClick={addFeaturedFeature}
                          type='button'
                          disabled={featureInput.trim().length === 0 || isSubmittingStep}
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='md:col-span-2 space-y-3'>
                    <label className='flex items-center gap-3'>
                      <input
                        className='h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary'
                        type='checkbox'
                        checked={Boolean(watchedStepOne.isCustomizable)}
                        onChange={(event) => {
                          stepOneForm.setValue('isCustomizable', event.target.checked, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          if (!event.target.checked) {
                            stepOneForm.setValue('customizationNote', '', {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                        disabled={isSubmittingStep}
                      />
                      <span className='text-sm font-bold text-on-surface'>Özelleştirilebilir mi?</span>
                    </label>

                    <label>
                      <span className='mb-2 block text-sm font-bold text-on-surface-variant'>
                        Özelleştirme Açıklaması
                      </span>
                      <textarea
                        className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                        rows={3}
                        placeholder='Logo baskısı, nakış veya özel üretim detaylarını yazın...'
                        {...stepOneForm.register('customizationNote')}
                        disabled={!watchedStepOne.isCustomizable || isSubmittingStep}
                      />
                      {stepOneForm.formState.errors.customizationNote ? (
                        <p className='mt-1 text-xs text-red-600'>
                          {stepOneForm.formState.errors.customizationNote.message}
                        </p>
                      ) : null}
                    </label>
                  </div>

                  <label className='md:col-span-2'>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Ürün Açıklaması</span>
                    <RichTextEditor
                      value={watchedStepOne.description ?? ''}
                      onChange={(nextValue) => {
                        stepOneForm.setValue('description', nextValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      placeholder='Ürün detaylarını buraya yazınız...'
                      disabled={isSubmittingStep}
                    />
                    {stepOneForm.formState.errors.description ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepOneForm.formState.errors.description.message}
                      </p>
                    ) : null}
                  </label>

                  <div className='md:col-span-2 flex justify-end'>
                    <button
                      className='inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                      type='submit'
                      disabled={isSubmittingStep || isLoadingMeta}
                    >
                      <span>Sonraki Adım</span>
                      <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {currentStep === 2 ? (
              <>
                <div className='mb-6 flex items-center gap-2'>
                  <span className='material-symbols-outlined text-primary'>sell</span>
                  <h3 className='text-xl font-bold tracking-tight text-on-surface'>Fiyatlandırma ve Stok</h3>
                </div>

                <form className='grid grid-cols-1 gap-6 md:grid-cols-2' onSubmit={onSubmitStepTwo}>
                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Birim Fiyat</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      step='0.01'
                      min='0'
                      {...stepTwoForm.register('basePrice')}
                    />
                    {stepTwoForm.formState.errors.basePrice ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepTwoForm.formState.errors.basePrice.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Para Birimi</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm uppercase outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      maxLength={3}
                      {...stepTwoForm.register('currency')}
                    />
                    {stepTwoForm.formState.errors.currency ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepTwoForm.formState.errors.currency.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Minimum Sipariş Adedi</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      min='1'
                      {...stepTwoForm.register('minOrderQuantity')}
                    />
                    {stepTwoForm.formState.errors.minOrderQuantity ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepTwoForm.formState.errors.minOrderQuantity.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Stok</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      min='0'
                      {...stepTwoForm.register('stock')}
                    />
                    {stepTwoForm.formState.errors.stock ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepTwoForm.formState.errors.stock.message}
                      </p>
                    ) : null}
                  </label>

                  <div className='md:col-span-2 flex items-center justify-between'>
                    <button
                      className='inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-slate-50'
                      type='button'
                      onClick={() => setCurrentStep(1)}
                      disabled={isSubmittingStep}
                    >
                      <span className='material-symbols-outlined text-[18px]'>arrow_back</span>
                      <span>Önceki Adım</span>
                    </button>

                    <button
                      className='inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                      type='submit'
                      disabled={isSubmittingStep}
                    >
                      <span>Sonraki Adım</span>
                      <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {currentStep === 3 ? (
              <>
                <div className='mb-6 flex items-center gap-2'>
                  <span className='material-symbols-outlined text-primary'>local_shipping</span>
                  <h3 className='text-xl font-bold tracking-tight text-on-surface'>Lojistik ve Medya</h3>
                </div>

                <form className='grid grid-cols-1 gap-6 md:grid-cols-2' onSubmit={onSubmitStepThree}>
                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Tedarik Süresi (Gün)</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      min='0'
                      {...stepThreeForm.register('leadTimeDays')}
                    />
                    {stepThreeForm.formState.errors.leadTimeDays ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepThreeForm.formState.errors.leadTimeDays.message}
                      </p>
                    ) : null}
                  </label>

                  <div></div>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Paket Uzunluğu (cm)</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      step='0.01'
                      min='0'
                      {...stepThreeForm.register('packageLengthCm')}
                    />
                    {stepThreeForm.formState.errors.packageLengthCm ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepThreeForm.formState.errors.packageLengthCm.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Paket Genişliği (cm)</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      step='0.01'
                      min='0'
                      {...stepThreeForm.register('packageWidthCm')}
                    />
                    {stepThreeForm.formState.errors.packageWidthCm ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepThreeForm.formState.errors.packageWidthCm.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Paket Yüksekliği (cm)</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      step='0.01'
                      min='0'
                      {...stepThreeForm.register('packageHeightCm')}
                    />
                    {stepThreeForm.formState.errors.packageHeightCm ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepThreeForm.formState.errors.packageHeightCm.message}
                      </p>
                    ) : null}
                  </label>

                  <label>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Paket Ağırlığı (kg)</span>
                    <input
                      className='w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
                      type='number'
                      step='0.001'
                      min='0'
                      {...stepThreeForm.register('packageWeightKg')}
                    />
                    {stepThreeForm.formState.errors.packageWeightKg ? (
                      <p className='mt-1 text-xs text-red-600'>
                        {stepThreeForm.formState.errors.packageWeightKg.message}
                      </p>
                    ) : null}
                  </label>

                  <div className='md:col-span-2'>
                    <span className='mb-2 block text-sm font-bold text-on-surface-variant'>
                      Ürün Görsel ve Videoları (Maks. 5)
                    </span>

                    <label className='flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-center transition-colors hover:border-primary'>
                      <span className='material-symbols-outlined text-primary'>upload</span>
                      <span className='text-sm font-semibold text-on-surface'>Dosya seçmek için tıklayın</span>
                      <span className='text-xs text-on-surface-variant'>PNG, JPG, WEBP, MP4, MOV</span>
                      <input
                        className='hidden'
                        type='file'
                        accept='image/png,image/jpeg,image/webp,video/mp4,video/quicktime'
                        multiple
                        onChange={(event) => handleMediaSelection(event.target.files)}
                        disabled={isSubmittingStep}
                      />
                    </label>

                    <div className='mt-3 space-y-2'>
                      {draftRecord?.media.map((media) => (
                        <p
                          key={media.id}
                          className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'
                        >
                          Yüklü: {media.originalName}
                        </p>
                      ))}

                      {uploadedMediaFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className='flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800'
                        >
                          <span className='truncate pr-3'>Yeni: {file.name}</span>
                          <button
                            className='inline-flex items-center text-blue-700 hover:text-red-600'
                            onClick={() => removePendingMediaAt(index)}
                            type='button'
                          >
                            <span className='material-symbols-outlined text-[16px]'>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className='md:col-span-2 flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-3'>
                    <input
                      className='h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary'
                      type='checkbox'
                      checked={submitConfirmed}
                      onChange={(event) => setSubmitConfirmed(event.target.checked)}
                      disabled={isSubmittingStep || isCompleted}
                    />
                    <span className='text-sm font-medium text-on-surface'>
                      Girdiğim bilgilerin doğru olduğunu ve ürünün onay sürecine gönderileceğini kabul ediyorum.
                    </span>
                  </label>

                  <div className='md:col-span-2 flex items-center justify-between'>
                    <button
                      className='inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-slate-50'
                      type='button'
                      onClick={() => setCurrentStep(2)}
                      disabled={isSubmittingStep || isCompleted}
                    >
                      <span className='material-symbols-outlined text-[18px]'>arrow_back</span>
                      <span>Önceki Adım</span>
                    </button>

                    <button
                      className='inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                      type='submit'
                      disabled={isSubmittingStep || isCompleted}
                    >
                      <span>{isCompleted ? 'Gönderildi' : 'Onaya Gönder'}</span>
                      <span className='material-symbols-outlined text-[18px]'>check_circle</span>
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </section>
        </div>

        <aside className='lg:col-span-4'>
          <div className='sticky top-24 space-y-4'>
            <section className='rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm'>
              <h3 className='mb-4 border-b border-surface-container pb-3 text-lg font-bold text-on-surface'>
                İşlem Özeti
              </h3>

              <div className='space-y-3 text-xs'>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Ürün Adı:</span>
                  <span className='text-right font-semibold text-on-surface'>{summaryName}</span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Kategori:</span>
                  <span className='text-right font-semibold text-on-surface'>{summaryCategoryText}</span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Sektörler:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {selectedSectorIds.length} adet
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Görseller / Video:</span>
                  <span className='text-right font-semibold text-on-surface'>{totalMediaCount} / 5</span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Birim Fiyat:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {watchedStepTwo.basePrice > 0
                      ? `${watchedStepTwo.currency || 'TRY'} ${watchedStepTwo.basePrice}`
                      : draftRecord?.basePrice
                        ? `${draftRecord.currency} ${draftRecord.basePrice}`
                        : 'Henüz girilmedi'}
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Stok:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {watchedStepTwo.stock >= 0
                      ? watchedStepTwo.stock
                      : draftRecord?.stock ?? 'Henüz girilmedi'}
                  </span>
                </div>
              </div>
            </section>

            <section className='rounded-2xl border border-blue-100 bg-blue-50 p-5'>
              <div className='flex items-start gap-3'>
                <span className='material-symbols-outlined text-blue-700'>lightbulb</span>
                <div>
                  <h4 className='text-sm font-bold text-blue-900'>Profesyonel İpucu</h4>
                  <p className='mt-1 text-xs leading-relaxed text-blue-800'>
                    Öne çıkan özellikleri kısa ve net etiketler halinde eklemek, alıcıların ürününüzü daha hızlı değerlendirmesine yardımcı olur.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
