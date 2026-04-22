'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  productListingStepOneSchema,
  productListingStepThreeSchema,
  productListingStepTwoSchema,
  type ProductListingDeliveryMethod,
  type ProductListingPackageType,
  type ProductListingStepOneDto,
  type ProductListingStepThreeDto,
  type ProductListingStepTwoDto,
  type ProductListingShippingTime,
} from '@toptannext/types';
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import {
  createProductListingStepOne,
  fetchCategoriesTree,
  fetchMyProductListingDrafts,
  fetchSectors,
  submitProductListing,
  updateProductListingStepOne,
  updateProductListingStepThree,
  updateProductListingStepTwo,
  uploadProductListingMedia,
  type CategoryTreeNode,
  type ProductListingMediaRecord,
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
  minOrderQuantity: 1,
  stock: 0,
  isNegotiationEnabled: false,
  negotiationThreshold: null,
  pricingTiers: [
    {
      minQuantity: 1,
      maxQuantity: 1,
      unitPrice: 0.01,
    },
  ],
};

const STEP_THREE_DEFAULT_VALUES: ProductListingStepThreeDto = {
  packageType: '' as ProductListingPackageType,
  leadTimeDays: 0,
  shippingTime: '' as ProductListingShippingTime,
  deliveryMethods: [],
  dynamicFreightAgreement: false,
  packageLengthCm: 0,
  packageWidthCm: 0,
  packageHeightCm: 0,
  packageWeightKg: 0,
};

const PACKAGE_TYPE_OPTIONS: Array<{ value: ProductListingPackageType; label: string }> = [
  { value: 'BOX', label: 'Koli' },
  { value: 'PALLET', label: 'Palet' },
  { value: 'SACK', label: 'Çuval' },
  { value: 'OTHER', label: 'Diğer' },
];

const SHIPPING_TIME_OPTIONS: Array<{
  value: ProductListingShippingTime;
  label: string;
  leadTimeDays: number;
}> = [
  { value: 'ONE_TO_THREE_DAYS', label: '1-3 İş Günü (Hızlı Gönderim)', leadTimeDays: 3 },
  { value: 'THREE_TO_FIVE_DAYS', label: '3-5 İş Günü', leadTimeDays: 5 },
  { value: 'ONE_WEEK', label: '1 Hafta', leadTimeDays: 7 },
  { value: 'CUSTOM_PRODUCTION', label: 'Özel Üretim / Termin Süreli', leadTimeDays: 14 },
];

const DELIVERY_METHOD_OPTIONS: Array<{
  value: ProductListingDeliveryMethod;
  title: string;
  description: string;
}> = [
  {
    value: 'CONTRACTED_CARGO',
    title: 'Anlaşmalı Kargo Firmaları',
    description: 'Yurtiçi, Aras, PTT',
  },
  {
    value: 'FREIGHT_FORWARDER',
    title: 'Ambar / Nakliyat Firması',
    description: 'Büyük hacimli siparişler için',
  },
  {
    value: 'BUYER_PICKUP',
    title: 'Alıcı Kendi Teslim Alabilir',
    description: 'Depodan teslim',
  },
  {
    value: 'OWN_VEHICLE',
    title: 'Kendi Aracımızla Gönderim',
    description: 'Bölgesel dağıtım ağı',
  },
];

const OTHER_OPTION_VALUE = 'other';
const MAX_TOTAL_IMAGE_COUNT = 6;
const MAX_GALLERY_IMAGE_COUNT = 5;
const MAX_VIDEO_COUNT = 1;
const MAX_PRICE_TIER_COUNT = 6;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 20;
const IMAGE_ACCEPT_MIME = 'image/jpeg,image/png,image/webp';
const VIDEO_ACCEPT_MIME = 'video/mp4,video/webm';

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

function FieldInfoHint({ text }: { text: string }) {
  return (
    <span className='group relative inline-flex items-center'>
      <button
        type='button'
        className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-outline-variant bg-white text-[11px] font-bold leading-none text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus:border-primary focus:text-primary focus:outline-none'
        aria-label={text}
        onClick={(event) => {
          event.preventDefault();
        }}
      >
        ?
      </button>
      <span className='pointer-events-none invisible absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-[11px] font-medium leading-relaxed text-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100'>
        {text}
      </span>
    </span>
  );
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
  const [pendingCoverImage, setPendingCoverImage] = useState<File | null>(null);
  const [pendingGalleryImages, setPendingGalleryImages] = useState<File[]>([]);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [isValidatingVideo, setIsValidatingVideo] = useState(false);
  const [submitConfirmed, setSubmitConfirmed] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryImageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pageTopRef = useRef<HTMLDivElement | null>(null);
  const stepSectionRef = useRef<HTMLElement | null>(null);
  const hasMountedStepRef = useRef(false);

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

        const [categoryResponse, sectorsResponse, listingsResponse] = await Promise.all([
          fetchCategoriesTree(),
          fetchSectors(),
          fetchMyProductListingDrafts(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategoryTree(categoryResponse);
        setSectors(sectorsResponse);

        const latestEditableDraft = listingsResponse.find(
          (listing) => listing.status === 'DRAFT' || listing.status === 'REJECTED',
        ) ?? null;

        setDraftRecord(latestEditableDraft);

        if (!latestEditableDraft) {
          return;
        }

        const draftSectorIds = latestEditableDraft.sectors.map((sector) => sector.sectorId);
        const normalizedMinOrderQuantity = Math.max(latestEditableDraft.minOrderQuantity ?? 1, 1);
        const normalizedBasePrice = Math.max(Number(latestEditableDraft.basePrice ?? '0.01'), 0.01);

        const normalizedPricingTiers = latestEditableDraft.pricingTiers.length > 0
          ? latestEditableDraft.pricingTiers.map((tier) => ({
            minQuantity: Math.max(Math.trunc(tier.minQuantity), 1),
            maxQuantity: Math.max(Math.trunc(tier.maxQuantity), Math.max(Math.trunc(tier.minQuantity), 1)),
            unitPrice: Math.max(Number(tier.unitPrice), 0.01),
          }))
          : [
            {
              minQuantity: normalizedMinOrderQuantity,
              maxQuantity: normalizedMinOrderQuantity,
              unitPrice: normalizedBasePrice,
            },
          ];

        stepOneForm.reset({
          name: latestEditableDraft.name,
          sku: latestEditableDraft.sku,
          categoryId: latestEditableDraft.categoryId,
          sectorIds: draftSectorIds,
          featuredFeatures: latestEditableDraft.featuredFeatures,
          isCustomizable: latestEditableDraft.isCustomizable,
          customizationNote: latestEditableDraft.customizationNote ?? '',
          description: latestEditableDraft.description,
        });

        stepTwoForm.reset({
          minOrderQuantity: normalizedMinOrderQuantity,
          stock: Math.max(latestEditableDraft.stock ?? 0, 0),
          isNegotiationEnabled: latestEditableDraft.isNegotiationEnabled,
          negotiationThreshold: latestEditableDraft.negotiationThreshold,
          pricingTiers: normalizedPricingTiers,
        });

        stepThreeForm.reset({
          packageType: latestEditableDraft.packageType ?? STEP_THREE_DEFAULT_VALUES.packageType,
          leadTimeDays: Math.max(latestEditableDraft.leadTimeDays ?? 0, 0),
          shippingTime: latestEditableDraft.shippingTime ?? STEP_THREE_DEFAULT_VALUES.shippingTime,
          deliveryMethods: latestEditableDraft.deliveryMethods,
          dynamicFreightAgreement: latestEditableDraft.dynamicFreightAgreement,
          packageLengthCm: Math.max(Number(latestEditableDraft.packageLengthCm ?? '0'), 0),
          packageWidthCm: Math.max(Number(latestEditableDraft.packageWidthCm ?? '0'), 0),
          packageHeightCm: Math.max(Number(latestEditableDraft.packageHeightCm ?? '0'), 0),
          packageWeightKg: Math.max(Number(latestEditableDraft.packageWeightKg ?? '0'), 0),
        });

        const categoryPath = findCategoryPath(categoryResponse, latestEditableDraft.categoryId);
        if (categoryPath) {
          setMainCategoryId(categoryPath.mainId);
          setSubCategoryId(categoryPath.subId);
        }
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
  }, [stepOneForm, stepTwoForm, stepThreeForm]);

  const activeCategoryPath = useMemo(() => {
    const categoryId = watchedStepOne.categoryId || draftRecord?.categoryId;
    if (!categoryId) {
      return null;
    }

    return findCategoryPath(categoryTree, categoryId);
  }, [categoryTree, draftRecord?.categoryId, watchedStepOne.categoryId]);

  const summaryCategoryText = useMemo(() => {
    if (watchedStepOne.categoryId === 'other' || draftRecord?.categoryId === 'other') {
      return 'Diğer';
    }

    if (!activeCategoryPath) {
      return 'Seçilmedi';
    }

    return activeCategoryPath.breadcrumb;
  }, [activeCategoryPath, draftRecord?.categoryId, watchedStepOne.categoryId]);

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

  useEffect(() => {
    if (!hasMountedStepRef.current) {
      hasMountedStepRef.current = true;
      return;
    }

    const target = pageTopRef.current ?? stepSectionRef.current;
    if (!target) {
      return;
    }

    const scrollToTarget = () => {
      const nextTop = target.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({
        top: Math.max(0, nextTop),
        behavior: 'auto',
      });
    };

    let rafOne = 0;
    let timeoutOne = 0;
    let timeoutTwo = 0;

    rafOne = window.requestAnimationFrame(() => {
      scrollToTarget();
      timeoutOne = window.setTimeout(scrollToTarget, 90);
      timeoutTwo = window.setTimeout(scrollToTarget, 220);
    });

    return () => {
      window.cancelAnimationFrame(rafOne);
      window.clearTimeout(timeoutOne);
      window.clearTimeout(timeoutTwo);
    };
  }, [currentStep]);

  const goToStep = (nextStep: WizardStep): void => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    setCurrentStep(nextStep);
  };

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

  const getExistingImageCount = (): number =>
    draftRecord?.media.filter((media) => media.mediaType === 'IMAGE').length ?? 0;

  const getExistingVideoCount = (): number =>
    draftRecord?.media.filter((media) => media.mediaType === 'VIDEO').length ?? 0;

  const validateImageFile = (file: File): string | null => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'Sadece JPG, PNG ve WEBP formatları desteklenir.';
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return 'Görsel boyutu maksimum 3MB olabilir.';
    }

    return null;
  };

  const getVideoDurationSeconds = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        URL.revokeObjectURL(objectUrl);
        resolve(duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Video süresi okunamadı.'));
      };

      video.src = objectUrl;
    });

  const validateVideoFile = async (file: File): Promise<string | null> => {
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      return 'Sadece MP4 ve WEBM video formatları desteklenir.';
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return 'Video boyutu maksimum 15MB ve 20 saniye olmalıdır.';
    }

    const duration = await getVideoDurationSeconds(file);
    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      return 'Video boyutu maksimum 15MB ve 20 saniye olmalıdır.';
    }

    return null;
  };

  const preventDropDefaults = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const setCoverImage = (file: File | null): void => {
    if (!file) {
      return;
    }

    const imageError = validateImageFile(file);
    if (imageError) {
      setGlobalError(imageError);
      return;
    }

    const existingImageCount = getExistingImageCount();
    if (existingImageCount > 0) {
      setGlobalError('Bu taslakta kapak görseli zaten mevcut. Yeni kapak için önce mevcut medyayı kaldırmalısınız.');
      return;
    }

    setPendingCoverImage(file);
    setGlobalError(null);
  };

  const appendGalleryImages = (files: File[]): void => {
    if (files.length === 0) {
      return;
    }

    const existingImageCount = getExistingImageCount();
    const existingGalleryCount = Math.max(existingImageCount - 1, 0);
    const acceptedFiles: File[] = [];

    for (const file of files) {
      const imageError = validateImageFile(file);
      if (imageError) {
        setGlobalError(imageError);
        return;
      }

      const projectedGalleryCount =
        existingGalleryCount + pendingGalleryImages.length + acceptedFiles.length + 1;
      if (projectedGalleryCount > MAX_GALLERY_IMAGE_COUNT) {
        setGlobalError('En fazla 5 adet galeri görseli yükleyebilirsiniz.');
        return;
      }

      const projectedImageTotal =
        existingImageCount + (pendingCoverImage ? 1 : 0) + pendingGalleryImages.length + acceptedFiles.length + 1;
      if (projectedImageTotal > MAX_TOTAL_IMAGE_COUNT) {
        setGlobalError('Toplam görsel sayısı 6 adedi geçemez.');
        return;
      }

      acceptedFiles.push(file);
    }

    setPendingGalleryImages((prev) => [...prev, ...acceptedFiles]);
    setGlobalError(null);
  };

  const setVideoFile = async (file: File | null): Promise<void> => {
    if (!file) {
      return;
    }

    if (getExistingVideoCount() >= MAX_VIDEO_COUNT) {
      setGlobalError('Bu taslakta zaten 1 video mevcut. En fazla 1 video yükleyebilirsiniz.');
      return;
    }

    setIsValidatingVideo(true);

    try {
      const videoError = await validateVideoFile(file);
      if (videoError) {
        setGlobalError(videoError);
        return;
      }

      setPendingVideoFile(file);
      setGlobalError(null);
    } catch {
      setGlobalError('Video süresi okunamadı. Lütfen farklı bir MP4/WEBM dosyası deneyin.');
    } finally {
      setIsValidatingVideo(false);
    }
  };

  const handleCoverInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    setCoverImage(file);
    event.target.value = '';
  };

  const handleGalleryInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []);
    appendGalleryImages(files);
    event.target.value = '';
  };

  const handleVideoInputChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    await setVideoFile(file);
    event.target.value = '';
  };

  const handleCoverDrop = (event: DragEvent<HTMLElement>): void => {
    preventDropDefaults(event);
    const file = event.dataTransfer.files?.[0] ?? null;
    setCoverImage(file);
  };

  const handleGalleryDrop = (event: DragEvent<HTMLElement>): void => {
    preventDropDefaults(event);
    const files = Array.from(event.dataTransfer.files ?? []);
    appendGalleryImages(files);
  };

  const handleVideoDrop = async (event: DragEvent<HTMLElement>): Promise<void> => {
    preventDropDefaults(event);
    const file = event.dataTransfer.files?.[0] ?? null;
    await setVideoFile(file);
  };

  const removePendingGalleryAt = (index: number): void => {
    setPendingGalleryImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const addPricingTier = (): void => {
    const currentTiers = stepTwoForm.getValues('pricingTiers') ?? [];
    if (currentTiers.length >= MAX_PRICE_TIER_COUNT) {
      setGlobalError('En fazla 6 fiyat kademesi tanımlayabilirsiniz.');
      return;
    }

    const lastTier = currentTiers[currentTiers.length - 1];
    const nextMinQuantity = lastTier ? Math.max(lastTier.maxQuantity + 1, 1) : 1;

    stepTwoForm.setValue('pricingTiers', [
      ...currentTiers,
      {
        minQuantity: nextMinQuantity,
        maxQuantity: nextMinQuantity,
        unitPrice: lastTier?.unitPrice ?? 0.01,
      },
    ], {
      shouldValidate: true,
      shouldDirty: true,
    });
    setGlobalError(null);
  };

  const removePricingTier = (index: number): void => {
    const currentTiers = stepTwoForm.getValues('pricingTiers') ?? [];
    if (currentTiers.length <= 1) {
      return;
    }

    stepTwoForm.setValue(
      'pricingTiers',
      currentTiers.filter((_, tierIndex) => tierIndex !== index),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  };

  const toggleNegotiationThreshold = (isEnabled: boolean): void => {
    stepTwoForm.setValue('isNegotiationEnabled', isEnabled, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!isEnabled) {
      stepTwoForm.setValue('negotiationThreshold', null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const updateShippingTime = (shippingTime: ProductListingShippingTime | ''): void => {
    stepThreeForm.setValue('shippingTime', shippingTime as ProductListingShippingTime, {
      shouldValidate: true,
      shouldDirty: true,
    });

    const selectedOption = SHIPPING_TIME_OPTIONS.find((option) => option.value === shippingTime);
    if (selectedOption) {
      stepThreeForm.setValue('leadTimeDays', selectedOption.leadTimeDays, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const toggleDeliveryMethod = (method: ProductListingDeliveryMethod): void => {
    const currentMethods = stepThreeForm.getValues('deliveryMethods') ?? [];
    const nextMethods = currentMethods.includes(method)
      ? currentMethods.filter((item) => item !== method)
      : [...currentMethods, method];

    stepThreeForm.setValue('deliveryMethods', nextMethods, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmitStepOne = stepOneForm.handleSubmit(async (values) => {
    const existingImageCount = getExistingImageCount();
    const existingVideoCount = getExistingVideoCount();
    const pendingImageCount = (pendingCoverImage ? 1 : 0) + pendingGalleryImages.length;

    if (existingImageCount === 0 && !pendingCoverImage) {
      setGlobalError('1 adet kapak görseli yüklemek zorunludur.');
      return;
    }

    if (existingImageCount + pendingImageCount > MAX_TOTAL_IMAGE_COUNT) {
      setGlobalError('Toplam görsel sayısı 6 adedi geçemez.');
      return;
    }

    if (Math.max(existingImageCount - 1, 0) + pendingGalleryImages.length > MAX_GALLERY_IMAGE_COUNT) {
      setGlobalError('En fazla 5 adet galeri görseli yükleyebilirsiniz.');
      return;
    }

    if (existingVideoCount + (pendingVideoFile ? 1 : 0) > MAX_VIDEO_COUNT) {
      setGlobalError('En fazla 1 video yükleyebilirsiniz.');
      return;
    }

    try {
      setIsSubmittingStep(true);
      setGlobalError(null);
      setSuccessMessage(null);

      const isUpdatingExistingDraft = Boolean(draftRecord?.id);
      const savedStepOne = draftRecord?.id
        ? await updateProductListingStepOne(draftRecord.id, values)
        : await createProductListingStepOne(values);
      setDraftRecord(savedStepOne);

      const pendingMediaToUpload = [
        pendingCoverImage,
        ...pendingGalleryImages,
        pendingVideoFile,
      ].filter((file): file is File => Boolean(file));

      const saved = pendingMediaToUpload.length > 0
        ? await uploadProductListingMedia(savedStepOne.id, pendingMediaToUpload)
        : savedStepOne;

      setDraftRecord(saved);
      setPendingCoverImage(null);
      setPendingGalleryImages([]);
      setPendingVideoFile(null);

      if (saved.categoryId) {
        const categoryPath = findCategoryPath(categoryTree, saved.categoryId);
        if (categoryPath) {
          setMainCategoryId(categoryPath.mainId);
          setSubCategoryId(categoryPath.subId);
        }
      }

      goToStep(2);
      setSuccessMessage(
        isUpdatingExistingDraft
          ? 'Temel ürün bilgileri güncellendi. Şimdi fiyatlandırma adımını tamamlayın.'
          : 'Temel ürün bilgileri kaydedildi. Şimdi fiyatlandırma adımını tamamlayın.',
      );
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

      const saved = await updateProductListingStepTwo(draftRecord.id, values);

      setDraftRecord(saved);
      goToStep(3);
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

      await updateProductListingStepThree(draftRecord.id, values);

      await submitProductListing(draftRecord.id, {
        confirmSubmission: true,
      });

      setDraftRecord(null);
      setMainCategoryId('');
      setSubCategoryId('');
      setFeatureInput('');
      setSectorInput('');
      setPendingCoverImage(null);
      setPendingGalleryImages([]);
      setPendingVideoFile(null);
      setSubmitConfirmed(false);
      setIsCompleted(false);

      stepOneForm.reset(STEP_ONE_DEFAULT_VALUES);
      stepTwoForm.reset(STEP_TWO_DEFAULT_VALUES);
      stepThreeForm.reset(STEP_THREE_DEFAULT_VALUES);

      goToStep(1);
      setSuccessMessage('Ürün başarıyla onaya gönderildi. Form temizlendi, yeni ürün girişi yapabilirsiniz.');
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Ürün onaya gönderilirken bir sorun oluştu.',
      );
    } finally {
      setIsSubmittingStep(false);
    }
  });

  const activeStepProgressWidth = `${(currentStep / 3) * 100}%`;

  const selectedSectorIds = useMemo(
    () => watchedStepOne.sectorIds ?? [],
    [watchedStepOne.sectorIds],
  );
  const sectorOptions = useMemo(
    () => [...sectors, { id: OTHER_OPTION_VALUE, name: 'Diğer' }],
    [sectors],
  );
  const selectedSectors = useMemo(
    () => sectorOptions.filter((sector) => selectedSectorIds.includes(sector.id)),
    [sectorOptions, selectedSectorIds],
  );
  const existingImageMedia = useMemo(
    () => (draftRecord?.media ?? []).filter((media) => media.mediaType === 'IMAGE'),
    [draftRecord?.media],
  );
  const existingVideoMedia = useMemo(
    () => (draftRecord?.media ?? []).filter((media) => media.mediaType === 'VIDEO'),
    [draftRecord?.media],
  );
  const existingCoverMedia = existingImageMedia[0] ?? null;
  const existingGalleryMedia = existingImageMedia.slice(1, MAX_TOTAL_IMAGE_COUNT);

  const summaryName =
    watchedStepOne.name.trim().length > 0
      ? watchedStepOne.name.trim()
      : draftRecord?.name ?? 'Henüz belirtilmedi';

  const pendingMediaCount =
    (pendingCoverImage ? 1 : 0) +
    pendingGalleryImages.length +
    (pendingVideoFile ? 1 : 0);
  const totalMediaCount = (draftRecord?.media.length ?? 0) + pendingMediaCount;
  const watchedPricingTiers = watchedStepTwo.pricingTiers ?? [];
  const effectivePricingTiers = watchedPricingTiers.length > 0
    ? watchedPricingTiers
    : draftRecord?.pricingTiers ?? [];
  const effectiveMinOrderQuantity = watchedStepTwo.minOrderQuantity > 0
    ? watchedStepTwo.minOrderQuantity
    : draftRecord?.minOrderQuantity ?? null;
  const activePricingTierForMinOrder = effectiveMinOrderQuantity
    ? effectivePricingTiers.find((tier) => (
      effectiveMinOrderQuantity >= tier.minQuantity && effectiveMinOrderQuantity <= tier.maxQuantity
    ))
    : null;
  const summaryStartingPrice = activePricingTierForMinOrder?.unitPrice
    ?? (draftRecord?.basePrice ? Number(draftRecord.basePrice) : null);
  const summaryNegotiationThreshold = watchedStepTwo.isNegotiationEnabled
    ? watchedStepTwo.negotiationThreshold
    : draftRecord?.isNegotiationEnabled
      ? draftRecord.negotiationThreshold
      : null;
  const packageTypeLabel = PACKAGE_TYPE_OPTIONS.find(
    (option) => option.value === watchedStepThree.packageType,
  )?.label ?? (draftRecord?.packageType
    ? PACKAGE_TYPE_OPTIONS.find((option) => option.value === draftRecord.packageType)?.label
    : null);
  const packageDimensionSummary =
    watchedStepThree.packageWidthCm > 0 &&
    watchedStepThree.packageLengthCm > 0 &&
    watchedStepThree.packageHeightCm > 0
      ? `${watchedStepThree.packageWidthCm} x ${watchedStepThree.packageLengthCm} x ${watchedStepThree.packageHeightCm} cm`
      : draftRecord?.packageWidthCm && draftRecord.packageLengthCm && draftRecord.packageHeightCm
        ? `${draftRecord.packageWidthCm} x ${draftRecord.packageLengthCm} x ${draftRecord.packageHeightCm} cm`
        : 'Henüz girilmedi';
  const shippingTimeLabel = SHIPPING_TIME_OPTIONS.find(
    (option) => option.value === watchedStepThree.shippingTime,
  )?.label ?? (draftRecord?.shippingTime
    ? SHIPPING_TIME_OPTIONS.find((option) => option.value === draftRecord.shippingTime)?.label
    : null);
  const selectedDeliveryMethodCount =
    watchedStepThree.deliveryMethods.length > 0
      ? watchedStepThree.deliveryMethods.length
      : draftRecord?.deliveryMethods.length ?? 0;

  return (
    <div ref={pageTopRef} className='space-y-8'>
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
          <section
            ref={stepSectionRef}
            className='rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm md:p-8'
          >
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
                    <div className='mb-2 flex items-center gap-2'>
                      <span className='block text-sm font-bold text-on-surface-variant'>SKU</span>
                      <FieldInfoHint text='SKU, ürününüzü sistemde benzersiz tanımlayan stok kodudur. Örn: TN-URUN-1001.' />
                    </div>
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
                            <option value='other'>DİĞER</option>
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
                            disabled={(!selectedMainCategory && mainCategoryId !== 'other') || isSubmittingStep}
                          >
                            <option value=''>Alt kategori seçiniz</option>
                            {(selectedMainCategory?.children ?? []).map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                            <option value='other'>Diğer</option>
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
                            disabled={(!selectedSubCategory && subCategoryId !== 'other') || isSubmittingStep}
                          >
                            <option value=''>En Alt Kategori seçiniz</option>
                            {leafCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                            <option value='other'>Diğer</option>
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
                          {sectorOptions.map((sector) => (
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
                    <div className='mt-1 flex items-center gap-2'>
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
                      <FieldInfoHint text='Bu seçenek açıksa alıcılar logo baskısı, renk, ölçü gibi özel talepler ile sipariş verebilir.' />
                    </div>

                    <label className='block'>
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

                  <div className='md:col-span-2'>
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
                  </div>

                  <div className='md:col-span-2'>
                    <div className='mb-2 flex items-center gap-2'>
                      <span className='text-sm font-bold text-on-surface-variant'>Ürün Görsel ve Videoları</span>
                      <FieldInfoHint text='1 kapak resmi zorunlu, en fazla 5 galeri görseli (toplam 6 görsel). Video (opsiyonel): En fazla 1 adet, 15MB, 20 saniye. Galeri: JPG, PNG veya WEBP, her biri maksimum 3MB.' />
                    </div>

                    <div className='rounded-xl border border-outline-variant bg-surface-container-low p-4 md:p-5'>

                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]'>
                      <div
                        className='group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-white px-4 py-5 text-center transition-colors hover:border-primary'
                        onClick={() => coverImageInputRef.current?.click()}
                        onDragOver={preventDropDefaults}
                        onDrop={handleCoverDrop}
                        role='button'
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            coverImageInputRef.current?.click();
                          }
                        }}
                      >
                        <input
                          ref={coverImageInputRef}
                          className='hidden'
                          type='file'
                          accept={IMAGE_ACCEPT_MIME}
                          onChange={handleCoverInputChange}
                          disabled={isSubmittingStep}
                        />

                        <div className='mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                          <span className='material-symbols-outlined'>upload</span>
                        </div>

                        <p className='text-2xl font-bold text-on-surface'>Kapak Görseli</p>
                        <p className='mt-2 text-sm text-on-surface-variant'>Yüklemek için tıklayın veya sürükleyin</p>

                        {pendingCoverImage ? (
                          <div className='mt-4 w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-left text-xs text-blue-900'>
                            <div className='flex items-center justify-between gap-2'>
                              <span className='truncate'>{pendingCoverImage.name}</span>
                              <button
                                type='button'
                                className='inline-flex items-center text-blue-700 hover:text-red-600'
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPendingCoverImage(null);
                                }}
                              >
                                <span className='material-symbols-outlined text-sm'>close</span>
                              </button>
                            </div>
                          </div>
                        ) : existingCoverMedia ? (
                          <p className='mt-4 w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700'>
                            Mevcut kapak: {existingCoverMedia.originalName}
                          </p>
                        ) : null}
                      </div>

                      <div
                        className='rounded-xl border border-outline-variant bg-surface p-3'
                        onDragOver={preventDropDefaults}
                        onDrop={handleGalleryDrop}
                      >
                        <input
                          ref={galleryImageInputRef}
                          className='hidden'
                          type='file'
                          accept={IMAGE_ACCEPT_MIME}
                          multiple
                          onChange={handleGalleryInputChange}
                          disabled={isSubmittingStep}
                        />

                        <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
                          {Array.from({ length: MAX_GALLERY_IMAGE_COUNT }).map((_, index) => {
                            const pendingImage = pendingGalleryImages[index];
                            const existingImage = existingGalleryMedia[index] as ProductListingMediaRecord | undefined;

                            if (pendingImage) {
                              return (
                                <div key={`pending-gallery-${index}`} className='relative rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900'>
                                  <p className='line-clamp-2 break-all pr-6'>{pendingImage.name}</p>
                                  <button
                                    type='button'
                                    className='absolute right-1 top-1 inline-flex items-center text-blue-700 hover:text-red-600'
                                    onClick={() => removePendingGalleryAt(index)}
                                  >
                                    <span className='material-symbols-outlined text-sm'>close</span>
                                  </button>
                                </div>
                              );
                            }

                            if (existingImage) {
                              return (
                                <div key={`existing-gallery-${existingImage.id}`} className='rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700'>
                                  <p className='line-clamp-2 break-all'>{existingImage.originalName}</p>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={`gallery-slot-${index}`}
                                type='button'
                                className='inline-flex min-h-[86px] items-center justify-center rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                                onClick={() => galleryImageInputRef.current?.click()}
                                disabled={isSubmittingStep}
                              >
                                <span className='material-symbols-outlined text-[28px]'>add</span>
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                    <div
                      className='mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant bg-white px-4 py-3 transition-colors hover:border-primary'
                      onClick={() => videoInputRef.current?.click()}
                      onDragOver={preventDropDefaults}
                      onDrop={(event) => {
                        void handleVideoDrop(event);
                      }}
                      role='button'
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          videoInputRef.current?.click();
                        }
                      }}
                    >
                      <input
                        ref={videoInputRef}
                        className='hidden'
                        type='file'
                        accept={VIDEO_ACCEPT_MIME}
                        onChange={(event) => {
                          void handleVideoInputChange(event);
                        }}
                        disabled={isSubmittingStep || isValidatingVideo}
                      />

                      <div>
                        <p className='text-sm font-semibold text-on-surface'>Video (Opsiyonel)</p>
                        {pendingVideoFile ? (
                          <p className='mt-1 text-xs text-blue-700'>Seçilen video: {pendingVideoFile.name}</p>
                        ) : existingVideoMedia[0] ? (
                          <p className='mt-1 text-xs text-slate-700'>Mevcut video: {existingVideoMedia[0].originalName}</p>
                        ) : null}
                      </div>

                      <div className='flex items-center gap-2'>
                        {pendingVideoFile ? (
                          <button
                            type='button'
                            className='inline-flex items-center text-blue-700 hover:text-red-600'
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingVideoFile(null);
                            }}
                          >
                            <span className='material-symbols-outlined text-[18px]'>close</span>
                          </button>
                        ) : null}
                        <span className='material-symbols-outlined text-primary'>video_library</span>
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className='md:col-span-2 flex justify-end'>
                    <button
                      className='inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                      type='submit'
                      disabled={isSubmittingStep || isLoadingMeta || isValidatingVideo}
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

                <form className='space-y-8' onSubmit={onSubmitStepTwo}>
                  <div className='rounded-xl border border-outline-variant bg-surface-container-low p-5 md:p-6'>
                    <h4 className='mb-6 text-[1.625rem] font-semibold text-on-surface'>Fiyatlandırma ve Stok Bilgileri</h4>

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      <label>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Toplam Stok Adedi</span>
                        <input
                          className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                          type='number'
                          min='0'
                          {...stepTwoForm.register('stock', {
                            valueAsNumber: true,
                          })}
                        />
                        {stepTwoForm.formState.errors.stock ? (
                          <p className='mt-1 text-xs text-red-600'>
                            {stepTwoForm.formState.errors.stock.message}
                          </p>
                        ) : null}
                      </label>

                      <label>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Minimum Sipariş Miktarı (MSM)</span>
                        <input
                          className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                          type='number'
                          min='1'
                          {...stepTwoForm.register('minOrderQuantity', {
                            valueAsNumber: true,
                          })}
                        />
                        <p className='mt-1 text-[11px] text-on-surface-variant'>Alıcıların tek seferde alabileceği en az miktar.</p>
                        {stepTwoForm.formState.errors.minOrderQuantity ? (
                          <p className='mt-1 text-xs text-red-600'>
                            {stepTwoForm.formState.errors.minOrderQuantity.message}
                          </p>
                        ) : null}
                      </label>

                      <div className='md:col-span-2 rounded-lg border border-outline-variant bg-white p-4'>
                        <div className='mb-3 flex items-center justify-between'>
                          <h5 className='text-base font-semibold text-on-surface'>Pazarlık Eşiği</h5>
                          <label className='inline-flex cursor-pointer items-center'>
                            <input
                              className='peer sr-only'
                              type='checkbox'
                              checked={Boolean(watchedStepTwo.isNegotiationEnabled)}
                              onChange={(event) => toggleNegotiationThreshold(event.target.checked)}
                              disabled={isSubmittingStep}
                            />
                            <span className='relative h-6 w-11 rounded-full bg-surface-container-highest transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-transform after:content-[""] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white' />
                          </label>
                        </div>

                        <label>
                          <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Pazarlık Sınırı (Adet)</span>
                          <input
                            className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-container-low'
                            type='number'
                            min='1'
                            placeholder='Örn: 200'
                            {...stepTwoForm.register('negotiationThreshold', {
                              setValueAs: (value) => {
                                if (value === '' || value === null || value === undefined) {
                                  return null;
                                }

                                return Number(value);
                              },
                            })}
                            disabled={!watchedStepTwo.isNegotiationEnabled || isSubmittingStep}
                          />
                          <p className='mt-1 text-[11px] text-on-surface-variant'>Bu miktarın üzerindeki siparişlerde teklif isteme akışı devreye girebilir.</p>
                          {stepTwoForm.formState.errors.negotiationThreshold ? (
                            <p className='mt-1 text-xs text-red-600'>
                              {stepTwoForm.formState.errors.negotiationThreshold.message}
                            </p>
                          ) : null}
                        </label>
                      </div>
                    </div>

                    <div className='mt-8 border-t border-outline-variant pt-6'>
                      <div className='mb-4 flex items-center justify-between gap-3'>
                        <h5 className='text-lg font-semibold text-on-surface'>Kademeli Fiyatlandırma</h5>
                        <button
                          type='button'
                          className='inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
                          onClick={addPricingTier}
                          disabled={isSubmittingStep || watchedPricingTiers.length >= MAX_PRICE_TIER_COUNT}
                        >
                          <span className='material-symbols-outlined text-[18px]'>add</span>
                          Kademe Ekle
                        </button>
                      </div>

                      <div className='overflow-hidden rounded-lg border border-outline-variant'>
                        <table className='w-full text-left text-sm'>
                          <thead className='bg-surface-container-low text-on-surface-variant'>
                            <tr>
                              <th className='px-4 py-3 text-xs font-semibold uppercase tracking-wide'>Miktar Aralığı</th>
                              <th className='px-4 py-3 text-xs font-semibold uppercase tracking-wide'>Birim Fiyat (₺)</th>
                              <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide'>İşlem</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-outline-variant/60 bg-white'>
                            {watchedPricingTiers.map((tier, index) => {
                              const threshold = watchedStepTwo.isNegotiationEnabled
                                ? watchedStepTwo.negotiationThreshold
                                : null;
                              const isThresholdCovered = typeof threshold === 'number'
                                && threshold >= tier.minQuantity
                                && threshold <= tier.maxQuantity;

                              return (
                                <tr
                                  key={`price-tier-${index}`}
                                  className={isThresholdCovered ? 'bg-blue-50/70' : 'bg-white'}
                                >
                                  <td className='px-4 py-3'>
                                    <div className='flex items-center gap-2'>
                                      <input
                                        className='w-24 rounded-md border border-outline-variant px-2 py-1.5 text-center text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary'
                                        type='number'
                                        min='1'
                                        {...stepTwoForm.register(`pricingTiers.${index}.minQuantity` as const, {
                                          valueAsNumber: true,
                                        })}
                                      />
                                      <span className='text-on-surface-variant'>-</span>
                                      <input
                                        className='w-24 rounded-md border border-outline-variant px-2 py-1.5 text-center text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary'
                                        type='number'
                                        min='1'
                                        {...stepTwoForm.register(`pricingTiers.${index}.maxQuantity` as const, {
                                          valueAsNumber: true,
                                        })}
                                      />
                                    </div>
                                    {isThresholdCovered ? (
                                      <p className='mt-1 text-[11px] font-medium text-primary'>Teklif eşiği bu aralıkta.</p>
                                    ) : null}
                                    {stepTwoForm.formState.errors.pricingTiers?.[index]?.minQuantity ? (
                                      <p className='mt-1 text-xs text-red-600'>
                                        {stepTwoForm.formState.errors.pricingTiers[index]?.minQuantity?.message}
                                      </p>
                                    ) : null}
                                    {stepTwoForm.formState.errors.pricingTiers?.[index]?.maxQuantity ? (
                                      <p className='mt-1 text-xs text-red-600'>
                                        {stepTwoForm.formState.errors.pricingTiers[index]?.maxQuantity?.message}
                                      </p>
                                    ) : null}
                                  </td>
                                  <td className='px-4 py-3'>
                                    <div className='relative w-36'>
                                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant'>₺</span>
                                      <input
                                        className='w-full rounded-md border border-outline-variant py-1.5 pl-7 pr-3 text-right text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary'
                                        type='number'
                                        step='0.01'
                                        min='0.01'
                                        {...stepTwoForm.register(`pricingTiers.${index}.unitPrice` as const, {
                                          valueAsNumber: true,
                                        })}
                                      />
                                    </div>
                                    {stepTwoForm.formState.errors.pricingTiers?.[index]?.unitPrice ? (
                                      <p className='mt-1 text-xs text-red-600'>
                                        {stepTwoForm.formState.errors.pricingTiers[index]?.unitPrice?.message}
                                      </p>
                                    ) : null}
                                  </td>
                                  <td className='px-4 py-3 text-right'>
                                    <button
                                      type='button'
                                      className='inline-flex rounded p-1 text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40'
                                      onClick={() => removePricingTier(index)}
                                      disabled={watchedPricingTiers.length <= 1 || isSubmittingStep}
                                    >
                                      <span className='material-symbols-outlined text-[18px]'>delete</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className='mt-2 flex items-center justify-between text-[11px] text-on-surface-variant'>
                        <span>{watchedPricingTiers.length} / {MAX_PRICE_TIER_COUNT} kademe kullanılıyor.</span>
                        {stepTwoForm.formState.errors.pricingTiers?.message ? (
                          <span className='text-red-600'>{stepTwoForm.formState.errors.pricingTiers.message}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <button
                      className='inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-slate-50'
                      type='button'
                      onClick={() => goToStep(1)}
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
                  <h3 className='text-xl font-bold tracking-tight text-on-surface'>Profesyonel Lojistik</h3>
                </div>

                <form className='space-y-8' onSubmit={onSubmitStepThree}>
                  <section className='rounded-xl border border-outline-variant bg-surface-container-low p-5 md:p-6'>
                    <h4 className='mb-6 text-[1.625rem] font-semibold text-on-surface'>Paketleme ve Boyut Bilgileri</h4>

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      <label>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Paket Tipi</span>
                        <div className='relative'>
                          <select
                            className='w-full appearance-none rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                            {...stepThreeForm.register('packageType')}
                            disabled={isSubmittingStep}
                          >
                            <option value=''>Seçiniz...</option>
                            {PACKAGE_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400'>
                            expand_more
                          </span>
                        </div>
                        {stepThreeForm.formState.errors.packageType ? (
                          <p className='mt-1 text-xs text-red-600'>
                            {stepThreeForm.formState.errors.packageType.message}
                          </p>
                        ) : null}
                      </label>

                      <label>
                        <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Paket Ağırlığı (kg)</span>
                        <input
                          className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                          placeholder='Örn: 2.5'
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
                    </div>

                    <div className='mt-6'>
                      <span className='mb-2 block text-sm font-bold text-on-surface-variant'>Boyutlar (cm)</span>
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                        <label>
                          <span className='sr-only'>En</span>
                          <input
                            className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                            placeholder='En'
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
                          <span className='sr-only'>Boy</span>
                          <input
                            className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                            placeholder='Boy'
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
                          <span className='sr-only'>Yükseklik</span>
                          <input
                            className='w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                            placeholder='Yükseklik'
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
                      </div>
                    </div>
                  </section>

                  <section className='rounded-xl border border-outline-variant bg-surface-container-low p-5 md:p-6'>
                    <h4 className='mb-6 text-[1.625rem] font-semibold text-on-surface'>Lojistik ve Teslimat Bilgileri</h4>

                    <label className='block max-w-xl'>
                      <span className='mb-2 block text-sm font-bold text-on-surface-variant'>
                        Sipariş Onayından Sonra Kargoya Verilme Süresi
                      </span>
                      <div className='relative'>
                        <select
                          className='w-full appearance-none rounded-lg border border-outline-variant bg-white px-3 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'
                          value={watchedStepThree.shippingTime}
                          onChange={(event) => updateShippingTime(event.target.value as ProductListingShippingTime | '')}
                          disabled={isSubmittingStep}
                        >
                          <option value=''>Seçiniz...</option>
                          {SHIPPING_TIME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400'>
                          expand_more
                        </span>
                      </div>
                      {stepThreeForm.formState.errors.shippingTime ? (
                        <p className='mt-1 text-xs text-red-600'>
                          {stepThreeForm.formState.errors.shippingTime.message}
                        </p>
                      ) : null}
                    </label>

                    <div className='mt-8'>
                      <span className='mb-3 block text-sm font-bold text-on-surface-variant'>Teslimat Yöntemleri</span>
                      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                        {DELIVERY_METHOD_OPTIONS.map((option) => {
                          const isChecked = watchedStepThree.deliveryMethods.includes(option.value);

                          return (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                                isChecked
                                  ? 'border-primary bg-primary/5'
                                  : 'border-outline-variant bg-white hover:border-primary hover:bg-surface-container-low'
                              }`}
                            >
                              <input
                                className='mt-0.5 h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary'
                                type='checkbox'
                                checked={isChecked}
                                onChange={() => toggleDeliveryMethod(option.value)}
                                disabled={isSubmittingStep}
                              />
                              <span>
                                <span className='block text-sm font-semibold text-on-surface'>{option.title}</span>
                                <span className='mt-1 block text-xs text-on-surface-variant'>{option.description}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {stepThreeForm.formState.errors.deliveryMethods ? (
                        <p className='mt-2 text-xs text-red-600'>
                          {stepThreeForm.formState.errors.deliveryMethods.message}
                        </p>
                      ) : null}
                    </div>

                    <div className='mt-8 border-t border-outline-variant pt-6'>
                      <div className='flex flex-col gap-4 rounded-xl border border-outline-variant/60 bg-white p-5 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='sm:pr-6'>
                          <h5 className='text-base font-semibold text-on-surface'>Dinamik Navlun Anlaşması</h5>
                          <p className='mt-1 text-sm leading-relaxed text-on-surface-variant'>
                            Kargo veya nakliye ücreti alıcı ile mesajlaşma/teklif aşamasında netleşsin.
                          </p>
                        </div>
                        <label className='inline-flex cursor-pointer items-center self-start sm:self-center'>
                          <input
                            className='peer sr-only'
                            type='checkbox'
                            checked={Boolean(watchedStepThree.dynamicFreightAgreement)}
                            onChange={(event) => {
                              stepThreeForm.setValue('dynamicFreightAgreement', event.target.checked, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            disabled={isSubmittingStep}
                          />
                          <span className='relative h-6 w-11 rounded-full bg-surface-container-highest transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-transform after:content-[""] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white' />
                        </label>
                      </div>
                    </div>
                  </section>

                  <label className='flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-3'>
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

                  <div className='flex items-center justify-between'>
                    <button
                      className='inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-slate-50'
                      type='button'
                      onClick={() => goToStep(2)}
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
                    {summaryStartingPrice !== null
                      ? `₺ ${summaryStartingPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Henüz girilmedi'}
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Kademeler:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {effectivePricingTiers.length > 0
                      ? `${effectivePricingTiers.length} adet`
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
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Minimum Sipariş:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {effectiveMinOrderQuantity ?? 'Henüz girilmedi'}
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Pazarlık Eşiği:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {summaryNegotiationThreshold
                      ? `${summaryNegotiationThreshold} adet`
                      : 'Kapalı'}
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Paket Tipi:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {packageTypeLabel ?? 'Henüz seçilmedi'}
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Paket/Boyutlar:</span>
                  <span className='text-right font-semibold text-on-surface'>{packageDimensionSummary}</span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='font-medium text-on-surface-variant'>Kargoya Verilme:</span>
                  <span className='text-right font-semibold text-on-surface'>
                    {shippingTimeLabel ?? 'Henüz seçilmedi'}
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3 rounded-lg bg-surface-container p-2'>
                  <span className='font-medium text-on-surface-variant'>Lojistik:</span>
                  <span className='text-right font-semibold text-primary'>
                    {selectedDeliveryMethodCount > 0
                      ? `${selectedDeliveryMethodCount} yöntem`
                      : 'Belirleniyor'}
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
