'use client';

import { type MouseEvent, type TouchEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { MainHeader } from '@/app/components/MainHeader';
import { ProductChatDrawer } from '@/components/chat/ProductChatDrawer';
import { addCartItem } from '@/features/cart/api/cart.api';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { createConversation } from '@/features/chat/api/chat.api';
import { getCurrentUserIdFromToken } from '@/features/chat/utils/auth';
import { getUserRoleFromToken, hasAccessToken } from '@/lib/auth-token';
import {
  FAVORITES_UPDATED_EVENT,
  isFavoriteProduct,
  toggleFavoriteProduct,
} from '@/lib/favorites';
import {
  fetchCategoriesTree,
  fetchPublicProductListingById,
  resolveProductListingAssetUrl,
  resolveProductListingMediaUrl,
  type CategoryTreeNode,
  type ProductListingRecord,
} from '@/features/product-listing/api/product-listing.api';
import {
  fetchMyProductReviewState,
  fetchProductReviews,
  upsertProductReview,
} from '@/features/product-reviews/api/product-reviews.api';

type PublicProductDetailViewProps = {
  id: string;
};

type ProductMediaImageProps = {
  src: string;
  alt: string;
  className: string;
};

function ProductMediaImage({ src, alt, className }: ProductMediaImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-slate-50 text-slate-400'>
        <span className='material-symbols-outlined text-5xl'>inventory_2</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      src={src}
    />
  );
}

function formatTryAmount(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumericValue(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function findCategoryTrailById(
  nodes: CategoryTreeNode[],
  targetId: string,
): CategoryTreeNode[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node];
    }

    const nested = findCategoryTrailById(node.children, targetId);
    if (nested.length > 0) {
      return [node, ...nested];
    }
  }

  return [];
}

function formatBreadcrumbLabel(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return value;
  }

  return trimmed
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

function buildListingPriceLabel(listing: ProductListingRecord): string {
  const tierPrices = listing.pricingTiers
    .map((tier) => Number(tier.unitPrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (tierPrices.length > 0) {
    const min = Math.min(...tierPrices);
    const max = Math.max(...tierPrices);
    return min === max ? formatTryAmount(min) : `${formatTryAmount(min)} - ${formatTryAmount(max)}`;
  }

  const basePrice = Number(listing.basePrice);
  if (Number.isFinite(basePrice) && basePrice > 0) {
    return formatTryAmount(basePrice);
  }

  return 'Fiyat sorunuz';
}

function renderRatingStars(rating: number, className = 'text-[18px]') {
  return Array.from({ length: 5 }, (_, index) => (
    <span
      className={`material-symbols-outlined ${className}`}
      key={`star-${index}`}
      style={{
        fontVariationSettings: index < Math.round(rating)
          ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24",
      }}
    >
      star
    </span>
  ));
}

export function PublicProductDetailView({ id }: PublicProductDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaTouchStartX, setMediaTouchStartX] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});
  const [activeDetailSection, setActiveDetailSection] = useState<'description' | 'reviews' | 'company'>('description');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [canSendQuote, setCanSendQuote] = useState(false);
  const [chatActionError, setChatActionError] = useState<string | null>(null);
  const [cartActionError, setCartActionError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isPrimaryPanelVisible, setIsPrimaryPanelVisible] = useState(true);
  const [primaryPanelHeight, setPrimaryPanelHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const primaryPanelRef = useRef<HTMLDivElement | null>(null);
  const scrollLockedSectionRef = useRef<'description' | 'reviews' | 'company' | null>(null);
  const scrollLockTimeoutRef = useRef<number | null>(null);
  const setCartTotalItems = useCartStore((state) => state.setTotalItems);
  const showCartToast = useCartStore((state) => state.showToast);

  const listingQuery = useQuery({
    queryKey: ['public', 'listing-detail', id],
    queryFn: () => fetchPublicProductListingById(id),
    enabled: id.length > 0,
  });

  const categoriesQuery = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: fetchCategoriesTree,
    staleTime: 5 * 60_000,
  });

  const listing = listingQuery.data;
  const currentUserId = getCurrentUserIdFromToken();
  const isOwnListing = Boolean(listing && currentUserId === listing.supplierId);
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => fetchProductReviews(id),
    enabled: id.length > 0,
  });
  const myReviewStateQuery = useQuery({
    queryKey: ['product-reviews', id, 'me'],
    queryFn: () => fetchMyProductReviewState(id),
    enabled: id.length > 0 && hasAccessToken(),
    retry: false,
  });
  const reviewMutation = useMutation({
    mutationFn: () => upsertProductReview(id, {
      rating: reviewRating,
      comment: reviewComment,
    }),
    onSuccess: () => {
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', id, 'me'] });
    },
    onError: (error) => {
      setReviewError(error.message);
    },
  });

  const imageMedia = useMemo(
    () => (listing?.media ?? []).filter((item) => item.mediaType === 'IMAGE'),
    [listing?.media],
  );

  const videoMedia = useMemo(
    () => (listing?.media ?? []).filter((item) => item.mediaType === 'VIDEO'),
    [listing?.media],
  );

  const allMedia = useMemo(() => [...imageMedia, ...videoMedia], [imageMedia, videoMedia]);

  useEffect(() => {
    if (!listing) {
      return;
    }

    const minOrder = listing.minOrderQuantity ?? 1;
    const stockLimit = listing.stock !== null && listing.stock > 0 ? listing.stock : null;
    setQuantity((current) => {
      const next = Math.max(current, minOrder);
      return stockLimit !== null ? Math.min(next, stockLimit) : next;
    });
    setSelectedMediaId((current) => current ?? allMedia[0]?.id ?? null);

    setVariantSelections((current) => {
      const next: Record<string, string> = {};

      listing.variantGroups.forEach((group, index) => {
        const key = `${group.groupName}-${index}`;
        const selected = current[key];
        const hasSelected = selected
          && group.options.some((option) => option.label === selected);

        if (hasSelected) {
          next[key] = selected;
          return;
        }

        if (group.options.length > 0) {
          next[key] = group.options[0].label;
        }
      });

      return next;
    });
  }, [allMedia, listing]);

  useEffect(() => {
    const myReview = myReviewStateQuery.data?.myReview;
    if (!myReview) {
      return;
    }

    setReviewRating(myReview.rating);
    setReviewComment(myReview.comment ?? '');
  }, [myReviewStateQuery.data?.myReview]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const node = primaryPanelRef.current;
    if (!node) {
      return;
    }

    const stickyTopOffset = 106;

    const updateVisibility = () => {
      const rect = node.getBoundingClientRect();
      // 1. panelin en ufak kısmı sticky çizgisinin altında kaldığı sürece görünür kabul edilir.
      setIsPrimaryPanelVisible(rect.bottom > stickyTopOffset);
      setPrimaryPanelHeight(node.offsetHeight);
      setViewportHeight(window.innerHeight);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          updateVisibility();
        })
      : null;

    resizeObserver?.observe(node);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
      resizeObserver?.disconnect();
    };
  }, [listing?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !listing) {
      return;
    }

    const orderedSectionIds: Array<'description' | 'reviews' | 'company'> = ['description', 'reviews', 'company'];
    const activationOffset = window.innerWidth < 1024 ? 96 : 210;
    const releaseScrollLock = () => {
      if (scrollLockTimeoutRef.current !== null) {
        window.clearTimeout(scrollLockTimeoutRef.current);
        scrollLockTimeoutRef.current = null;
      }
      scrollLockedSectionRef.current = null;
    };

    const updateActiveSection = () => {
      if (scrollLockedSectionRef.current) {
        const lockedSectionId = scrollLockedSectionRef.current;
        const target = document.getElementById(lockedSectionId);

        if (!target) {
          releaseScrollLock();
        } else {
          const targetLine = Math.max(0, target.offsetTop - activationOffset);
          if (Math.abs(window.scrollY - targetLine) <= 20) {
            releaseScrollLock();
            setActiveDetailSection(lockedSectionId);
            return;
          }

          setActiveDetailSection(lockedSectionId);
          return;
        }
      }

      const currentLine = window.scrollY + activationOffset;
      let nextActiveSection: 'description' | 'reviews' | 'company' = 'description';

      orderedSectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) {
          return;
        }

        if (section.offsetTop <= currentLine) {
          nextActiveSection = sectionId;
        }
      });

      setActiveDetailSection(nextActiveSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      releaseScrollLock();
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [listing]);

  const selectedMedia = useMemo(
    () => allMedia.find((item) => item.id === selectedMediaId) ?? allMedia[0] ?? null,
    [allMedia, selectedMediaId],
  );
  const selectedMediaIndex = useMemo(
    () => allMedia.findIndex((item) => item.id === selectedMedia?.id),
    [allMedia, selectedMedia?.id],
  );

  const canNavigateMedia = allMedia.length > 1;
  const activeMediaIndex = selectedMediaIndex >= 0 ? selectedMediaIndex : 0;

  const selectMediaByIndex = (nextIndex: number) => {
    if (allMedia.length === 0) {
      return;
    }

    const normalizedIndex = ((nextIndex % allMedia.length) + allMedia.length) % allMedia.length;
    setSelectedMediaId(allMedia[normalizedIndex].id);
  };

  const goToPreviousMedia = () => {
    if (!canNavigateMedia) {
      return;
    }

    selectMediaByIndex(selectedMediaIndex - 1);
  };

  const goToNextMedia = () => {
    if (!canNavigateMedia) {
      return;
    }

    selectMediaByIndex(selectedMediaIndex + 1);
  };

  const handleMediaTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!canNavigateMedia) {
      return;
    }

    setMediaTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleMediaTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!canNavigateMedia || mediaTouchStartX === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX;
    setMediaTouchStartX(null);

    if (touchEndX === undefined) {
      return;
    }

    const deltaX = touchEndX - mediaTouchStartX;
    if (Math.abs(deltaX) < 36) {
      return;
    }

    if (deltaX > 0) {
      goToPreviousMedia();
      return;
    }

    goToNextMedia();
  };

  const sortedPricingTiers = useMemo(
    () => [...(listing?.pricingTiers ?? [])].sort((left, right) => left.minQuantity - right.minQuantity),
    [listing?.pricingTiers],
  );
  const sanitizedDescription = useMemo(
    () => (listing?.description ? DOMPurify.sanitize(listing.description) : ''),
    [listing?.description],
  );

  const minOrderQuantity = listing?.minOrderQuantity ?? sortedPricingTiers[0]?.minQuantity ?? 1;
  const stockLimit = listing?.stock ?? null;
  const isOutOfStock = stockLimit !== null && stockLimit <= 0;
  const isStockBelowMinimum = stockLimit !== null && stockLimit > 0 && stockLimit < minOrderQuantity;

  const selectedTier = useMemo(() => {
    if (!listing) {
      return null;
    }

    if (sortedPricingTiers.length === 0) {
      return null;
    }

    const matched = sortedPricingTiers.find((tier) => (
      quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    ));
    if (matched) {
      return matched;
    }

    const lastTier = sortedPricingTiers[sortedPricingTiers.length - 1];
    if (lastTier.maxQuantity === null || quantity > lastTier.maxQuantity) {
      return sortedPricingTiers[sortedPricingTiers.length - 1];
    }

    return sortedPricingTiers[0];
  }, [listing, quantity, sortedPricingTiers]);

  const basePrice = parseNumericValue(listing?.basePrice);
  const unitPrice = selectedTier?.unitPrice ?? basePrice ?? 0;
  const subtotal = unitPrice * quantity;
  const referencePrice = sortedPricingTiers[0]?.unitPrice ?? unitPrice;
  const savingsAmount = Math.max(0, (referencePrice - unitPrice) * quantity);

  const categoryTrail = useMemo(() => {
    if (!listing) {
      return [];
    }

    return findCategoryTrailById(categoriesQuery.data ?? [], listing.categoryId);
  }, [categoriesQuery.data, listing]);

  const supplierDisplayName =
    listing?.supplierCompanyName
    ?? listing?.supplierName
    ?? 'Onaylı Tedarikçi';
  const favoriteCategory = categoryTrail[categoryTrail.length - 1] ?? null;
  const favoriteImageUrl = imageMedia.length > 0
    ? resolveProductListingMediaUrl(imageMedia[0])
    : null;
  const favoritePriceLabel = listing ? buildListingPriceLabel(listing) : 'Fiyat sorunuz';
  useEffect(() => {
    setCanSendQuote(getUserRoleFromToken() === 'SUPPLIER');
  }, []);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!listing) {
        throw new Error('Ürün bulunamadı.');
      }

      return addCartItem({
        productListingId: listing.id,
        quantity,
      });
    },
    onSuccess: async (cart) => {
      setCartActionError(null);
      setCartTotalItems(cart.totalItems);
      showCartToast(`${listing?.name ?? 'Ürün'} sepete eklendi.`);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
  const isCartDisabled = addToCartMutation.isPending || isOwnListing || isOutOfStock || isStockBelowMinimum;

  const handleStartConversation = async () => {
    if (!listing || isStartingConversation) {
      return;
    }

    setChatActionError(null);

    if (!hasAccessToken()) {
      router.push(`/login?next=${encodeURIComponent(`/urun/${listing.id}`)}`);
      return;
    }

    const currentUserId = getCurrentUserIdFromToken();
    if (currentUserId && currentUserId === listing.supplierId) {
      setChatActionError('Kendi ürününüz için sohbet başlatamazsınız.');
      return;
    }

    setIsStartingConversation(true);

    try {
      const conversation = await createConversation({
        participantId: listing.supplierId,
        productListingId: listing.id,
      });

      setActiveConversationId(conversation.id);
      setIsChatDrawerOpen(true);
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Sohbet başlatılamadı. Lütfen tekrar deneyin.';
      setChatActionError(message);
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleAddToCart = async () => {
    if (!listing || addToCartMutation.isPending) {
      return;
    }

    setCartActionError(null);

    if (!hasAccessToken()) {
      router.push(`/login?next=${encodeURIComponent(`/urun/${listing.id}`)}`);
      return;
    }

    if (currentUserId && currentUserId === listing.supplierId) {
      setCartActionError('Kendi ürününüzü sepete ekleyemezsiniz.');
      return;
    }

    try {
      await addToCartMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Ürün sepete eklenemedi. Lütfen tekrar deneyin.';
      setCartActionError(message);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !listing) {
      return;
    }

    const syncFavoriteState = () => {
      setIsFavorited(isFavoriteProduct(listing.id));
    };

    syncFavoriteState();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteState);
    window.addEventListener('storage', syncFavoriteState);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteState);
      window.removeEventListener('storage', syncFavoriteState);
    };
  }, [listing]);

  const findMediaForVariantImage = (rawImageUrl: string | null | undefined) => {
    if (!rawImageUrl || !listing) {
      return null;
    }

    const value = rawImageUrl.trim();
    if (value.length === 0) {
      return null;
    }

    const normalizePath = (pathValue: string) => pathValue.replace(/\\/g, '/');
    const normalizedValue = normalizePath(value);
    const optionBasename = normalizedValue.split('/').pop() ?? '';

    return listing.media.find((media) => {
      const normalizedFilePath = normalizePath(media.filePath);
      const mediaBasename = normalizedFilePath.split('/').pop() ?? '';

      return (
        normalizedFilePath === normalizedValue
        || normalizedFilePath.endsWith(normalizedValue)
        || normalizedValue.endsWith(normalizedFilePath)
        || (optionBasename.length > 0 && mediaBasename === optionBasename)
      );
    }) ?? null;
  };

  const resolveVariantOptionImageUrl = (rawImageUrl: string | null | undefined): string | null => {
    if (!rawImageUrl || !listing) {
      return null;
    }

    const value = rawImageUrl.trim();
    if (value.length === 0) {
      return null;
    }

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }

    const matchedMedia = findMediaForVariantImage(value);

    if (matchedMedia) {
      return resolveProductListingMediaUrl(matchedMedia);
    }

    return resolveProductListingAssetUrl(value);
  };

  const renderSidebarBody = () => (
    <>
      <div>
        {listing!.isCustomizable ? (
          <span className='mb-2 inline-flex rounded border border-blue-200 bg-blue-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700 sm:mb-3 sm:px-3 sm:text-[11px] sm:tracking-widest'>
            Özelleştirilebilir
          </span>
        ) : null}
      </div>

      {listing!.variantGroups.length > 0 ? (
        <div className='rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 sm:p-5'>
          <div className='space-y-3 sm:space-y-4'>
            {listing!.variantGroups.map((group, groupIndex) => {
              const groupKey = `${group.groupName}-${groupIndex}`;
              const selectedLabel = variantSelections[groupKey];

              return (
                <div key={groupKey}>
                  <p className='mb-1.5 text-xs font-semibold text-on-surface sm:mb-2 sm:text-sm'>{group.groupName}</p>
                  <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                    {group.options.map((option) => {
                      const isSelected = selectedLabel === option.label;
                      return (
                        <button
                          key={option.label}
                          className={[
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-sm',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-outline-variant/40 bg-white text-on-surface hover:border-primary/40',
                          ].join(' ')}
                          onClick={() => {
                            setVariantSelections((current) => ({
                              ...current,
                              [groupKey]: option.label,
                            }));
                            if (group.displayType === 'image' && option.imageUrl) {
                              const matchedMedia = findMediaForVariantImage(option.imageUrl);
                              if (matchedMedia) {
                                setSelectedMediaId(matchedMedia.id);
                              }
                            }
                          }}
                          type='button'
                        >
                          {group.displayType === 'image' && option.imageUrl ? (
                            <ProductMediaImage
                              alt={option.label}
                              className='h-4 w-4 rounded-full border border-outline-variant/30 object-cover sm:h-5 sm:w-5'
                              src={resolveVariantOptionImageUrl(option.imageUrl) ?? ''}
                            />
                          ) : null}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className='rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 sm:p-5'>
        {sortedPricingTiers.length > 0 ? (
          <div className='grid grid-cols-3 gap-2 sm:gap-3'>
            {sortedPricingTiers.map((tier) => {
              const isActive = selectedTier
                ? selectedTier.minQuantity === tier.minQuantity && selectedTier.maxQuantity === tier.maxQuantity
                : false;
              return (
                <button
                  key={`${tier.minQuantity}-${tier.maxQuantity}`}
                  className={[
                    'rounded-lg border px-1.5 py-2 text-center transition-colors sm:rounded-xl sm:p-4',
                    isActive
                      ? 'border-2 border-primary/40 bg-primary/5'
                      : 'border-outline-variant/30 bg-white hover:border-primary/30',
                  ].join(' ')}
                  onClick={() => {
                    const nextQuantity = Math.max(minOrderQuantity, tier.minQuantity);
                    setQuantity(stockLimit !== null && stockLimit > 0
                      ? Math.min(nextQuantity, stockLimit)
                      : nextQuantity);
                  }}
                  type='button'
                >
                  <div className={`mb-1 text-[9px] font-medium uppercase tracking-[0.02em] sm:text-[11px] sm:tracking-[0.03em] ${isActive ? 'text-primary' : 'text-outline'}`}>
                    {tier.maxQuantity === null ? `>= ${tier.minQuantity} Adet` : `${tier.minQuantity}-${tier.maxQuantity} Adet`}
                  </div>
                  <div className={`text-sm font-semibold leading-none sm:text-[1.40rem] sm:font-medium sm:tracking-[-0.01em] ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {formatTryAmount(tier.unitPrice)}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className='rounded-lg border border-outline-variant/30 bg-white p-3 text-center sm:p-4'>
            <div className='text-[10px] font-bold uppercase text-outline sm:text-xs'>Birim Fiyat</div>
            <div className='text-lg font-semibold leading-none text-on-surface sm:text-[1.40rem] sm:font-medium sm:tracking-[-0.01em]'>
              {formatTryAmount(unitPrice)}
            </div>
          </div>
        )}

        <div className='mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant/20 bg-surface-container-highest py-1 sm:mt-4 sm:gap-2 sm:py-1.5'>
          <span className='material-symbols-outlined text-sm text-outline'>trending_down</span>
          <p className='text-[10px] font-medium text-on-surface-variant sm:text-[11px]'>
            Bu alımla {formatTryAmount(savingsAmount)} kar ettiniz
          </p>
        </div>
      </div>

      <div className='rounded-xl border border-outline-variant/40 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-6'>
        <div className='mb-3 sm:mb-6'>
          <label className='mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-outline sm:mb-2 sm:text-xs'>
            Miktar Seçin
          </label>
          <div className='flex items-center overflow-hidden rounded-lg border border-outline-variant'>
            <button
              className='p-2 transition-colors hover:bg-surface-container-low sm:p-3'
              type='button'
              onClick={() => setQuantity((current) => Math.max(minOrderQuantity, current - 1))}
            >
              <span className='material-symbols-outlined text-sm'>remove</span>
            </button>
            <input
              className='h-9 w-full border-none text-center text-sm font-bold text-on-surface focus:ring-0 sm:h-auto sm:text-base'
              min={minOrderQuantity}
              type='number'
              value={quantity}
              onChange={(event) => {
                const raw = Number(event.target.value);
                if (!Number.isFinite(raw)) {
                  return;
                }
                const nextQuantity = Math.max(minOrderQuantity, Math.floor(raw));
                setQuantity(stockLimit !== null && stockLimit > 0
                  ? Math.min(nextQuantity, stockLimit)
                  : nextQuantity);
              }}
            />
            <button
              className='p-2 transition-colors hover:bg-surface-container-low sm:p-3'
              type='button'
              onClick={() => setQuantity((current) => (
                stockLimit !== null && stockLimit > 0
                  ? Math.min(stockLimit, current + 1)
                  : current + 1
              ))}
            >
              <span className='material-symbols-outlined text-sm'>add</span>
            </button>
          </div>
          <p className='mt-1 text-center text-[9px] font-medium text-primary sm:mt-1.5 sm:text-[10px]'>
            Minimum Sipariş (MSM): {minOrderQuantity} Adet
          </p>
          {stockLimit !== null ? (
            <p className={[
              'mt-1 text-center text-[9px] font-medium sm:text-[10px]',
              isOutOfStock || isStockBelowMinimum ? 'text-red-600' : 'text-outline',
            ].join(' ')}>
              {isOutOfStock
                ? 'Stokta yok'
                : isStockBelowMinimum
                  ? `Stok MSM değerinden düşük: ${stockLimit} Adet`
                  : `Mevcut stok: ${stockLimit} Adet`}
            </p>
          ) : null}
        </div>

        <div className='mb-3 grid grid-cols-3 gap-2 sm:mb-6 sm:block sm:space-y-3'>
          <div className='rounded-lg bg-surface-container-low px-2 py-2 text-center sm:flex sm:items-center sm:justify-between sm:bg-transparent sm:p-0 sm:text-sm'>
            <span className='block text-[10px] text-outline sm:inline sm:text-sm'>Birim Fiyat</span>
            <span className='block text-xs font-bold sm:inline sm:text-sm'>{formatTryAmount(unitPrice)}</span>
          </div>
          <div className='rounded-lg bg-surface-container-low px-2 py-2 text-center sm:flex sm:items-center sm:justify-between sm:bg-transparent sm:p-0 sm:text-sm'>
            <span className='block text-[10px] text-outline sm:inline sm:text-sm'>Ara Toplam</span>
            <span className='block text-xs font-bold sm:inline sm:text-sm'>{formatTryAmount(subtotal)}</span>
          </div>
          <div className='hidden h-px bg-outline-variant/30 sm:block' />
          <div className='rounded-lg bg-primary/5 px-2 py-2 text-center sm:flex sm:items-end sm:justify-between sm:bg-transparent sm:p-0'>
            <span className='block text-[10px] font-bold text-on-surface sm:inline sm:text-sm'>Toplam</span>
            <span className='block text-sm font-extrabold text-primary sm:inline sm:text-xl'>{formatTryAmount(subtotal)}</span>
          </div>
        </div>

        <div className='mt-3 grid grid-cols-2 gap-2 border-t border-outline-variant/30 pt-3 sm:mt-6 sm:block sm:space-y-4 sm:pt-6'>
          <div className='flex items-start gap-2 sm:gap-3'>
            <span className='material-symbols-outlined text-[18px] text-green-600 sm:text-2xl'>verified_user</span>
            <p className='text-[10px] leading-tight sm:text-[11px]'>
              <span className='block font-bold'>Güvenli Ödeme</span>
              Güvence paketi.
            </p>
          </div>
          <div className='flex items-start gap-2 sm:gap-3'>
            <span className='material-symbols-outlined text-[18px] text-blue-500 sm:text-2xl'>local_shipping</span>
            <p className='text-[10px] leading-tight sm:text-[11px]'>
              <span className='block font-bold'>Hızlı Lojistik</span>
              7-14 iş günü.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderSidebarActions = (sticky: boolean) => (
    <div className={[
      'border-t border-outline-variant/30 bg-white p-3 sm:p-5',
      sticky ? 'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-[80] shrink-0 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.12)] backdrop-blur lg:sticky lg:inset-x-auto lg:bottom-0 lg:z-30 lg:shadow-none' : '',
    ].join(' ')}>
      <div className='grid grid-cols-2 gap-2 sm:gap-3'>
        <button
          className='flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1A56DB] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:gap-2 sm:py-3 sm:text-base'
          disabled={isCartDisabled}
          onClick={handleAddToCart}
          type='button'
        >
          <span className='material-symbols-outlined text-[20px] sm:text-2xl'>shopping_cart</span>
          {isOwnListing
            ? 'Kendi Ürünün'
            : isOutOfStock
              ? 'Stokta Yok'
              : isStockBelowMinimum
                ? 'Stok Yetersiz'
                : addToCartMutation.isPending
                  ? 'Ekleniyor...'
                  : 'Sepete Ekle'}
        </button>
        <button
          className='flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#1A56DB] bg-white py-2.5 text-xs font-bold text-[#1A56DB] transition-all hover:bg-surface-container-low active:scale-[0.98] sm:gap-2 sm:py-3 sm:text-base'
          disabled={isStartingConversation}
          onClick={handleStartConversation}
          type='button'
        >
          <span className='material-symbols-outlined text-[20px] sm:text-2xl'>chat</span>
          {isStartingConversation ? 'Açılıyor...' : 'Sohbet Et'}
        </button>
      </div>
      {chatActionError ? (
        <p className='mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700'>
          {chatActionError}
        </p>
      ) : null}
      {cartActionError ? (
        <p className='mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700'>
          {cartActionError}
        </p>
      ) : null}
    </div>
  );

  const scrollToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: 'description' | 'reviews' | 'company',
  ) => {
    event.preventDefault();

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    const topOffset = window.innerWidth < 1024 ? 76 : 160;
    const nextTop = target.getBoundingClientRect().top + window.scrollY - topOffset;

    if (scrollLockTimeoutRef.current !== null) {
      window.clearTimeout(scrollLockTimeoutRef.current);
    }

    scrollLockedSectionRef.current = sectionId;
    scrollLockTimeoutRef.current = window.setTimeout(() => {
      scrollLockedSectionRef.current = null;
      scrollLockTimeoutRef.current = null;
    }, 1200);

    setActiveDetailSection(sectionId);
    window.history.replaceState(null, '', `#${sectionId}`);
    window.scrollTo({
      top: Math.max(0, nextTop),
      behavior: 'smooth',
    });
  };

  if (listingQuery.isLoading) {
    return (
      <div className='bg-surface text-on-surface'>
        <MainHeader />
        <main className='mx-auto max-w-[1440px] px-6 py-10'>
          <div className='h-10 w-2/5 animate-pulse rounded-lg bg-slate-200' />
          <div className='mt-6 grid gap-8 lg:grid-cols-12'>
            <div className='h-[420px] animate-pulse rounded-2xl bg-slate-200 lg:col-span-7' />
            <div className='h-[420px] animate-pulse rounded-2xl bg-slate-200 lg:col-span-5' />
          </div>
        </main>
      </div>
    );
  }

  if (listingQuery.isError || !listing) {
    return (
      <div className='bg-surface text-on-surface'>
        <MainHeader />
        <main className='mx-auto max-w-[1120px] px-6 py-10'>
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            Ürün detayı yüklenirken hata oluştu veya ürün bulunamadı.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='bg-surface text-on-surface'>
      <MainHeader />

      <main className='mx-auto max-w-[1440px] px-4 pb-36 pt-5 sm:px-6 sm:py-8'>
        <nav className='mb-6 flex items-center gap-1 text-xs font-medium text-outline overflow-x-auto flex-nowrap'>
          {categoryTrail.map((item, index) => {
            const isLast = index === categoryTrail.length - 1;

            return (
              <span key={item.id} className='flex items-center gap-1 whitespace-nowrap'>
                <Link className='hover:text-primary whitespace-nowrap' href={`/kategori/${item.slug}`}>
                  {formatBreadcrumbLabel(item.name)}
                </Link>
                {isLast ? null : (
                  <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
                )}
              </span>
            );
          })}
        </nav>

        <div className='mb-12 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8'>
          <div className='flex flex-col gap-5 lg:col-span-7 lg:gap-8'>
            <h1 className='text-[1.35rem] font-medium leading-tight tracking-normal text-on-surface'>
              {listing.name}
            </h1>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-[96px_minmax(0,1fr)]'>
              {allMedia.length > 0 ? (
                <div className='hidden max-h-[640px] space-y-3 overflow-y-auto pr-1 md:block'>
                  {allMedia.map((media) => (
                    <button
                      key={media.id}
                      className={[
                        'relative aspect-square w-full overflow-hidden rounded-lg border bg-white transition-colors',
                        selectedMedia?.id === media.id
                          ? 'border-2 border-primary'
                          : 'border-outline-variant/30 hover:border-primary/50',
                      ].join(' ')}
                      onClick={() => setSelectedMediaId(media.id)}
                      type='button'
                    >
                      {media.mediaType === 'VIDEO' ? (
                        <div className='absolute inset-0 flex items-center justify-center bg-black/35 text-xs font-bold text-white'>
                          +Video
                        </div>
                      ) : null}
                      <ProductMediaImage
                        alt={media.originalName}
                        className={`h-full w-full object-cover ${media.mediaType === 'VIDEO' ? 'opacity-50' : ''}`}
                        src={resolveProductListingMediaUrl(media)}
                      />
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                className='relative aspect-square overflow-hidden rounded-xl border border-outline-variant/30 bg-white'
                onTouchEnd={handleMediaTouchEnd}
                onTouchStart={handleMediaTouchStart}
              >
                {allMedia.length > 0 ? (
                  <div
                    className='flex h-full transition-transform duration-500 ease-out'
                    style={{ transform: `translateX(-${activeMediaIndex * 100}%)` }}
                  >
                    {allMedia.map((media) => (
                      <div className='h-full w-full shrink-0' key={media.id}>
                        {media.mediaType === 'VIDEO' ? (
                          <video
                            className='h-full w-full object-contain'
                            controls
                            src={resolveProductListingMediaUrl(media)}
                          />
                        ) : (
                          <ProductMediaImage
                            alt={listing.name}
                            className='h-full w-full object-contain'
                            src={resolveProductListingMediaUrl(media)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex h-full items-center justify-center text-slate-400'>
                    <span className='material-symbols-outlined text-6xl'>inventory_2</span>
                  </div>
                )}

                <button
                  aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  className={[
                    'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-colors md:right-4 md:top-4 md:h-12 md:w-12',
                    isFavorited
                      ? 'text-[#FF5A1F]'
                      : 'text-[#111111] hover:text-[#FF5A1F]',
                  ].join(' ')}
                  onClick={() => {
                    if (!listing) {
                      return;
                    }

                    const nextIsFavorited = toggleFavoriteProduct({
                      id: listing.id,
                      name: listing.name,
                      imageUrl: favoriteImageUrl,
                      priceLabel: favoritePriceLabel,
                      minOrderQuantity: listing.minOrderQuantity,
                      categoryName: favoriteCategory?.name ?? listing.categoryName ?? null,
                      categorySlug: favoriteCategory?.slug ?? null,
                    });
                    setIsFavorited(nextIsFavorited);
                  }}
                  type='button'
                >
                  <span
                    className='material-symbols-outlined text-[21px] md:text-[26px]'
                    style={{
                      fontVariationSettings: isFavorited
                        ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    favorite
                  </span>
                </button>

                <button
                  aria-label='Önceki görsel'
                  className='absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/30 bg-white/85 text-on-surface shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 md:flex'
                  disabled={!canNavigateMedia}
                  onClick={goToPreviousMedia}
                  type='button'
                >
                  <span className='material-symbols-outlined'>chevron_left</span>
                </button>
                <button
                  aria-label='Sonraki görsel'
                  className='absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/30 bg-white/85 text-on-surface shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 md:flex'
                  disabled={!canNavigateMedia}
                  onClick={goToNextMedia}
                  type='button'
                >
                  <span className='material-symbols-outlined'>chevron_right</span>
                </button>
              </div>
            </div>

            {allMedia.length > 0 ? (
              <div className='grid grid-cols-4 gap-3 md:hidden'>
                {allMedia.map((media) => (
                  <button
                    key={media.id}
                    className={[
                      'relative aspect-square overflow-hidden rounded-lg border bg-white transition-colors',
                      selectedMedia?.id === media.id
                        ? 'border-2 border-primary'
                        : 'border-outline-variant/30 hover:border-primary/50',
                    ].join(' ')}
                    onClick={() => setSelectedMediaId(media.id)}
                    type='button'
                  >
                    {media.mediaType === 'VIDEO' ? (
                      <div className='absolute inset-0 flex items-center justify-center bg-black/35 text-xs font-bold text-white'>
                        +Video
                      </div>
                    ) : null}
                    <ProductMediaImage
                      alt={media.originalName}
                      className={`h-full w-full object-cover ${media.mediaType === 'VIDEO' ? 'opacity-50' : ''}`}
                      src={resolveProductListingMediaUrl(media)}
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <div className='lg:hidden'>
              <div className='rounded-2xl border border-outline-variant/30 bg-white shadow-sm'>
                <div className='space-y-3 p-3'>
                  {renderSidebarBody()}
                </div>
                {renderSidebarActions(true)}
              </div>
            </div>

            <div className='space-y-3'>
              <h3 className='text-sm font-bold text-on-surface'>Öne Çıkan Özellikler</h3>
              <div className='grid grid-cols-2 gap-2 sm:gap-3'>
                {(listing.featuredFeatures.length > 0
                  ? listing.featuredFeatures
                  : [{ title: 'Standart Özellik', description: 'Bu ürün için özellik bilgisi eklenmedi.' }])
                  .slice(0, 4)
                  .map((feature, index) => (
                    <div
                      key={`${feature.title}-${index}`}
                      className='flex min-w-0 items-center gap-2 rounded-lg border border-outline-variant/30 bg-white p-2 sm:gap-3 sm:p-3'
                    >
                      <span className='material-symbols-outlined shrink-0 text-[19px] text-primary sm:text-2xl'>
                        {index % 2 === 0 ? 'bolt' : 'speed'}
                      </span>
                      <div className='min-w-0'>
                        <div className='truncate text-[9px] font-bold uppercase tracking-tight text-outline sm:text-[10px]'>
                          {feature.title}
                        </div>
                        <div className='line-clamp-2 text-[10px] font-semibold leading-tight text-on-surface sm:text-xs'>
                          {feature.description || feature.title}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className='sticky top-0 z-40 mb-2 bg-surface/95 py-2 backdrop-blur lg:top-[104px]'>
              <div className='grid max-w-[820px] grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-[0_10px_28px_rgba(15,23,42,0.12)] ring-1 ring-white/70'>
                <a
                  className={[
                    'flex items-center justify-center whitespace-nowrap border-b-2 px-1.5 py-3 text-center text-[11px] font-bold transition-colors sm:px-3 sm:py-4 sm:text-sm',
                    activeDetailSection === 'description'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-outline',
                  ].join(' ')}
                  href='#description'
                  onClick={(event) => scrollToSection(event, 'description')}
                >
                  Ürün Açıklaması
                </a>
                <a
                  className={[
                    'flex items-center justify-center whitespace-nowrap border-b-2 px-1.5 py-3 text-center text-[11px] font-bold transition-colors sm:px-3 sm:py-4 sm:text-sm',
                    activeDetailSection === 'reviews'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-outline',
                  ].join(' ')}
                  href='#reviews'
                  onClick={(event) => scrollToSection(event, 'reviews')}
                >
                  Değerlendirmeler
                </a>
                <a
                  className={[
                    'flex items-center justify-center whitespace-nowrap border-b-2 px-1.5 py-3 text-center text-[11px] font-bold transition-colors sm:px-3 sm:py-4 sm:text-sm',
                    activeDetailSection === 'company'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-outline',
                  ].join(' ')}
                  href='#company'
                  onClick={(event) => scrollToSection(event, 'company')}
                >
                  Şirket Profili
                </a>
              </div>
            </div>

            <div className='flex flex-1 flex-col gap-5 sm:gap-8'>
              <section id='description' className='scroll-mt-20 overflow-hidden rounded-2xl border border-outline-variant/30 bg-white lg:scroll-mt-48'>
                <div className='border-b border-outline-variant/30 bg-surface-container-lowest px-4 py-3 sm:px-8 sm:py-5'>
                  <h2 className='text-base font-bold text-on-surface sm:text-lg'>Ürün Açıklaması</h2>
                </div>
                <div className='p-4 sm:p-8'>
                  {listing.productInfoRows.length > 0 ? (
                    <div className='mb-5 grid grid-cols-1 gap-x-16 gap-y-2 sm:mb-8 md:grid-cols-2 md:gap-y-4'>
                      {listing.productInfoRows.map((row, index) => (
                        <div
                          className='flex justify-between gap-4 border-b border-outline-variant/10 py-2 sm:py-3'
                          key={`${row.label}-${index}`}
                        >
                          <span className='text-xs text-outline sm:text-sm'>{row.label}</span>
                          <span className='text-right text-xs font-semibold text-on-surface sm:text-sm'>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {sanitizedDescription ? (
                    <div
                      className='text-[12px] leading-5 text-on-surface-variant sm:text-sm sm:leading-7 [&_p]:mb-1.5 sm:[&_p]:mb-3 [&_p:empty]:hidden [&_strong]:font-bold [&_strong]:text-on-surface [&_ul]:mb-2.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 sm:[&_ul]:mb-4 sm:[&_ul]:space-y-2 sm:[&_ul]:pl-5 [&_li>p]:mb-0'
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  ) : (
                    <p className='text-[12px] leading-5 text-on-surface-variant sm:text-sm sm:leading-relaxed'>
                      Bu ürün için henüz açıklama girilmedi.
                    </p>
                  )}
                </div>
              </section>

              <section id='reviews' className='scroll-mt-20 overflow-hidden rounded-2xl border border-outline-variant/30 bg-white lg:scroll-mt-48'>
                <div className='border-b border-outline-variant/30 bg-surface-container-lowest px-4 py-3 sm:px-8 sm:py-5'>
                  <h2 className='text-base font-bold text-on-surface sm:text-lg'>
                    Değerlendirmeler ({reviewsQuery.data?.summary.count ?? 0})
                  </h2>
                </div>
                <div className='space-y-4 p-4 sm:space-y-6 sm:p-8'>
                  <div className='flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-3 sm:gap-4 sm:px-4'>
                    <div className='text-2xl font-extrabold text-on-surface sm:text-4xl'>
                      {(reviewsQuery.data?.summary.averageRating ?? 0).toFixed(1)}
                    </div>
                    <div>
                      <div className='flex text-[#FF5A1F]'>
                        {renderRatingStars(reviewsQuery.data?.summary.averageRating ?? 0, 'text-[16px] sm:text-[21px]')}
                      </div>
                      <div className='text-[11px] font-medium text-outline sm:text-xs'>
                        {reviewsQuery.data?.summary.count ?? 0} ürün değerlendirmesi
                      </div>
                    </div>
                  </div>

                  {myReviewStateQuery.data?.canReview ? (
                    <div className='rounded-xl border border-primary/15 bg-primary/5 p-3 sm:p-4'>
                      <div className='mb-2 flex items-center justify-between gap-3'>
                        <span className='text-xs font-bold text-on-surface sm:text-sm'>
                          {myReviewStateQuery.data.myReview ? 'Değerlendirmeni güncelle' : 'Ürünü değerlendir'}
                        </span>
                        <div className='flex gap-0.5 text-[#FF5A1F]'>
                          {Array.from({ length: 5 }, (_, index) => (
                            <button
                              aria-label={`${index + 1} puan ver`}
                              key={`rating-button-${index}`}
                              onClick={() => setReviewRating(index + 1)}
                              type='button'
                            >
                              <span
                                className='material-symbols-outlined text-[20px] sm:text-[24px]'
                                style={{
                                  fontVariationSettings: index < reviewRating
                                    ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                                    : "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24",
                                }}
                              >
                                star
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className='h-20 w-full resize-none rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm'
                        maxLength={1000}
                        onChange={(event) => setReviewComment(event.target.value)}
                        placeholder='Ürün deneyimini kısaca paylaş...'
                        value={reviewComment}
                      />
                      {reviewError ? (
                        <p className='mt-2 text-xs font-medium text-red-600'>{reviewError}</p>
                      ) : null}
                      <button
                        className='mt-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate()}
                        type='button'
                      >
                        {reviewMutation.isPending ? 'Kaydediliyor...' : 'Değerlendirmeyi Kaydet'}
                      </button>
                    </div>
                  ) : hasAccessToken() && myReviewStateQuery.data?.reason ? (
                    <p className='rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-[11px] font-medium text-outline sm:text-xs'>
                      {myReviewStateQuery.data.reason}
                    </p>
                  ) : null}

                  <div className='divide-y divide-outline-variant/15'>
                    {(reviewsQuery.data?.items ?? []).map((review) => (
                      <div className='py-3 first:pt-0 last:pb-0' key={review.id}>
                        <div className='mb-1.5 flex items-center justify-between gap-3'>
                          <span className='text-xs font-bold text-on-surface sm:text-sm'>{review.buyerName}</span>
                          <span className='text-[10px] text-outline sm:text-xs'>
                            {new Intl.DateTimeFormat('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(review.createdAt))}
                          </span>
                        </div>
                        <div className='mb-1 flex text-[#FF5A1F]'>
                          {renderRatingStars(review.rating, 'text-[15px] sm:text-[18px]')}
                        </div>
                        {review.comment ? (
                          <p className='text-xs leading-5 text-on-surface-variant sm:text-sm sm:leading-6'>
                            {review.comment}
                          </p>
                        ) : null}
                      </div>
                    ))}

                    {!reviewsQuery.isLoading && (reviewsQuery.data?.items.length ?? 0) === 0 ? (
                      <p className='py-3 text-xs font-medium text-outline sm:text-sm'>
                        Bu ürün için henüz değerlendirme yok.
                      </p>
                    ) : null}

                    {reviewsQuery.isLoading ? (
                      <p className='py-3 text-xs font-medium text-outline sm:text-sm'>
                        Değerlendirmeler yükleniyor...
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section id='company' className='scroll-mt-20 overflow-hidden rounded-2xl border border-outline-variant/30 bg-white lg:flex lg:flex-1 lg:flex-col lg:scroll-mt-48'>
                <div className='border-b border-outline-variant/30 bg-surface-container-lowest px-4 py-3 sm:px-8 sm:py-5'>
                  <h2 className='text-base font-bold text-on-surface sm:text-lg'>Şirket Profili</h2>
                </div>
                <div className='p-4 sm:p-8 lg:flex lg:flex-1 lg:flex-col'>
                  <div className='mb-10 flex flex-col gap-6 md:flex-row md:items-center'>
                    <div className='flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container'>
                      <span className='material-symbols-outlined text-5xl text-primary'>factory</span>
                    </div>
                    <div>
                      <div className='mb-1 flex items-center gap-3'>
                        <h3 className='text-2xl font-bold'>{supplierDisplayName}</h3>
                        <span className='rounded border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700'>
                          Onaylı Tedarikçi
                        </span>
                      </div>
                      <p className='flex items-center gap-1.5 text-sm text-outline'>
                        <span className='material-symbols-outlined text-sm'>location_on</span>
                        {listing.supplierCity ?? 'Türkiye'}, {listing.supplierDistrict ?? 'Merkez'} | 12 Yıllık Sektörel Deneyim
                      </p>
                    </div>
                    <div className='flex gap-3 md:ml-auto'>
                      <button className='rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90' type='button'>
                        Tedarikçiyi Takip Et
                      </button>
                      <button className='rounded-lg border border-outline-variant px-6 py-2.5 text-sm font-bold transition-colors hover:bg-surface' type='button'>
                        Mağazayı Ziyaret Et
                      </button>
                    </div>
                  </div>

                  <div className='space-y-8'>
                    <div>
                      <h4 className='mb-4 text-base font-bold text-on-surface'>Şirket Hakkında</h4>
                      <p className='text-sm leading-relaxed text-on-surface-variant'>
                        Tedarikçi profili sistemde mevcut ürün yayınları baz alınarak gösterilmektedir. Bu alanda şirketin üretim, ihracat ve kalite süreçlerine ilişkin özet bilgiler yer alır.
                      </p>
                    </div>

                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                      <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 text-center'>
                        <div className='text-lg font-extrabold text-primary'>2012</div>
                        <div className='text-[10px] font-bold uppercase text-outline'>Kuruluş</div>
                      </div>
                      <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 text-center'>
                        <div className='text-lg font-extrabold text-primary'>50k+</div>
                        <div className='text-[10px] font-bold uppercase text-outline'>Aylık Kapasite</div>
                      </div>
                      <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 text-center'>
                        <div className='text-lg font-extrabold text-primary'>150+</div>
                        <div className='text-[10px] font-bold uppercase text-outline'>Personel</div>
                      </div>
                      <div className='rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 text-center'>
                        <div className='text-lg font-extrabold text-primary'>ISO</div>
                        <div className='text-[10px] font-bold uppercase text-outline'>Sertifika</div>
                      </div>
                    </div>

                    <div>
                      <h4 className='mb-4 text-base font-bold text-on-surface'>Üretim Tesisi ve Ekibimiz</h4>
                      <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
                        {imageMedia.slice(0, 3).map((media) => (
                          <div key={media.id} className='aspect-video overflow-hidden rounded-lg bg-slate-100'>
                            <ProductMediaImage
                              alt={media.originalName}
                              className='h-full w-full object-cover'
                              src={resolveProductListingMediaUrl(media)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <aside className='hidden lg:col-span-5 lg:block lg:self-start'>
              <div className='space-y-8'>
              <div ref={primaryPanelRef} className='rounded-2xl border border-outline-variant/30 bg-white shadow-sm'>
                <div className='space-y-6 p-5 sm:p-6'>
                  {renderSidebarBody()}
                </div>
                {renderSidebarActions(false)}
              </div>

              <div
                className='hidden lg:block'
                style={{
                  minHeight: primaryPanelHeight > 0 && viewportHeight > 0
                    ? `${primaryPanelHeight + viewportHeight - 124}px`
                    : 'calc(200vh - 124px)',
                }}
              >
                <div
                  className={[
                    'rounded-2xl border border-outline-variant/30 bg-white shadow-sm lg:sticky lg:top-[106px] lg:h-[calc(100vh-124px)] lg:overflow-hidden lg:transition-all lg:duration-300 lg:ease-out',
                    isPrimaryPanelVisible
                      ? 'lg:pointer-events-none lg:invisible lg:translate-y-2 lg:opacity-0'
                      : 'lg:visible lg:translate-y-0 lg:opacity-100',
                  ].join(' ')}
                >
                  <div className='flex h-full flex-col'>
                    <div className='min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-6 [scrollbar-width:thin] [scrollbar-color:#c8ced9_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400'>
                      {renderSidebarBody()}
                    </div>
                    {renderSidebarActions(true)}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <ProductChatDrawer
        canSendQuote={canSendQuote}
        conversationId={activeConversationId}
        open={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
      />
    </div>
  );
}
