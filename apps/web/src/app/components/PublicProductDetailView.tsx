'use client';

import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MainHeader } from '@/app/components/MainHeader';
import {
  fetchCategoriesTree,
  fetchPublicProductListingById,
  resolveProductListingAssetUrl,
  resolveProductListingMediaUrl,
  type CategoryTreeNode,
} from '@/features/product-listing/api/product-listing.api';

type PublicProductDetailViewProps = {
  id: string;
};

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

export function PublicProductDetailView({ id }: PublicProductDetailViewProps) {
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});
  const [activeDetailSection, setActiveDetailSection] = useState<'description' | 'reviews' | 'company'>('description');
  const [isPrimaryPanelVisible, setIsPrimaryPanelVisible] = useState(true);
  const [primaryPanelHeight, setPrimaryPanelHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const primaryPanelRef = useRef<HTMLDivElement | null>(null);

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
    setQuantity((current) => Math.max(current, minOrder));
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
    const activationOffset = 210;

    const updateActiveSection = () => {
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

  const sortedPricingTiers = useMemo(
    () => [...(listing?.pricingTiers ?? [])].sort((left, right) => left.minQuantity - right.minQuantity),
    [listing?.pricingTiers],
  );

  const minOrderQuantity = listing?.minOrderQuantity ?? sortedPricingTiers[0]?.minQuantity ?? 1;

  const selectedTier = useMemo(() => {
    if (!listing) {
      return null;
    }

    if (sortedPricingTiers.length === 0) {
      return null;
    }

    const matched = sortedPricingTiers.find((tier) => quantity >= tier.minQuantity && quantity <= tier.maxQuantity);
    if (matched) {
      return matched;
    }

    if (quantity > sortedPricingTiers[sortedPricingTiers.length - 1].maxQuantity) {
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
      return resolveProductListingMediaUrl(matchedMedia.id);
    }

    return resolveProductListingAssetUrl(value);
  };

  const renderSidebarBody = () => (
    <>
      <div>
        {listing!.isCustomizable ? (
          <span className='mb-3 inline-flex rounded border border-blue-200 bg-blue-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-700'>
            Özelleştirilebilir
          </span>
        ) : null}
      </div>

      {listing!.variantGroups.length > 0 ? (
        <div className='rounded-xl border border-outline-variant/20 bg-surface-container-low p-5'>
          <div className='space-y-4'>
            {listing!.variantGroups.map((group, groupIndex) => {
              const groupKey = `${group.groupName}-${groupIndex}`;
              const selectedLabel = variantSelections[groupKey];

              return (
                <div key={groupKey}>
                  <p className='mb-2 text-sm font-semibold text-on-surface'>{group.groupName}</p>
                  <div className='flex flex-wrap gap-2'>
                    {group.options.map((option) => {
                      const isSelected = selectedLabel === option.label;
                      return (
                        <button
                          key={option.label}
                          className={[
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={option.label}
                              className='h-5 w-5 rounded-full border border-outline-variant/30 object-cover'
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

      <div className='rounded-xl border border-outline-variant/20 bg-surface-container-low p-5'>
        {sortedPricingTiers.length > 0 ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {sortedPricingTiers.map((tier) => {
              const isActive = selectedTier
                ? selectedTier.minQuantity === tier.minQuantity && selectedTier.maxQuantity === tier.maxQuantity
                : false;
              return (
                <button
                  key={`${tier.minQuantity}-${tier.maxQuantity}`}
                  className={[
                    'rounded-xl border p-4 text-center transition-colors',
                    isActive
                      ? 'border-2 border-primary/40 bg-primary/5'
                      : 'border-outline-variant/30 bg-white hover:border-primary/30',
                  ].join(' ')}
                  onClick={() => setQuantity(Math.max(minOrderQuantity, tier.minQuantity))}
                  type='button'
                >
                  <div className={`mb-1 text-[11px] font-medium uppercase tracking-[0.03em] ${isActive ? 'text-primary' : 'text-outline'}`}>
                    {tier.maxQuantity >= 1_000_000 ? `${tier.minQuantity}+ Adet` : `${tier.minQuantity}-${tier.maxQuantity} Adet`}
                  </div>
                  <div className={`text-[1.40rem] font-medium leading-none tracking-[-0.01em] ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {formatTryAmount(tier.unitPrice)}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className='rounded-lg border border-outline-variant/30 bg-white p-4 text-center'>
            <div className='text-xs font-bold uppercase text-outline'>Birim Fiyat</div>
            <div className='text-[1.40rem] font-medium leading-none tracking-[-0.01em] text-on-surface'>
              {formatTryAmount(unitPrice)}
            </div>
          </div>
        )}

        <div className='mt-4 flex items-center justify-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-highest py-1.5'>
          <span className='material-symbols-outlined text-sm text-outline'>trending_down</span>
          <p className='text-[11px] font-medium text-on-surface-variant'>
            Bu alımla {formatTryAmount(savingsAmount)} kar ettiniz
          </p>
        </div>
      </div>

      <div className='rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm'>
        <div className='mb-6'>
          <label className='mb-2 block text-xs font-bold uppercase tracking-wide text-outline'>
            Miktar Seçin
          </label>
          <div className='flex items-center overflow-hidden rounded-lg border border-outline-variant'>
            <button
              className='p-3 transition-colors hover:bg-surface-container-low'
              type='button'
              onClick={() => setQuantity((current) => Math.max(minOrderQuantity, current - 1))}
            >
              <span className='material-symbols-outlined text-sm'>remove</span>
            </button>
            <input
              className='w-full border-none text-center font-bold text-on-surface focus:ring-0'
              min={minOrderQuantity}
              type='number'
              value={quantity}
              onChange={(event) => {
                const raw = Number(event.target.value);
                if (!Number.isFinite(raw)) {
                  return;
                }
                setQuantity(Math.max(minOrderQuantity, Math.floor(raw)));
              }}
            />
            <button
              className='p-3 transition-colors hover:bg-surface-container-low'
              type='button'
              onClick={() => setQuantity((current) => current + 1)}
            >
              <span className='material-symbols-outlined text-sm'>add</span>
            </button>
          </div>
          <p className='mt-1.5 text-center text-[10px] font-medium text-primary'>
            Minimum Sipariş (MSM): {minOrderQuantity} Adet
          </p>
        </div>

        <div className='mb-6 space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-outline'>Birim Fiyat</span>
            <span className='font-bold'>{formatTryAmount(unitPrice)}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-outline'>Ara Toplam</span>
            <span className='font-bold'>{formatTryAmount(subtotal)}</span>
          </div>
          <div className='h-px bg-outline-variant/30' />
          <div className='flex items-end justify-between'>
            <span className='text-sm font-bold text-on-surface'>Toplam Tahmini</span>
            <span className='text-xl font-extrabold text-primary'>{formatTryAmount(subtotal)}</span>
          </div>
        </div>

        <div className='mt-6 space-y-4 border-t border-outline-variant/30 pt-6'>
          <div className='flex items-start gap-3'>
            <span className='material-symbols-outlined text-green-600'>verified_user</span>
            <p className='text-[11px] leading-tight'>
              <span className='block font-bold'>Güvenli Ödeme</span>
              ToptanNext Güvence Paketi ile paranız teslimat onayına kadar bizde kalır.
            </p>
          </div>
          <div className='flex items-start gap-3'>
            <span className='material-symbols-outlined text-blue-500'>local_shipping</span>
            <p className='text-[11px] leading-tight'>
              <span className='block font-bold'>Hızlı Lojistik</span>
              Global depolardan 7-14 iş günü içinde adrese teslimat.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderSidebarActions = (sticky: boolean) => (
    <div className={[
      'border-t border-outline-variant/30 bg-white p-4 sm:p-5',
      sticky ? 'sticky bottom-0 z-30 shrink-0 bg-white/95 backdrop-blur' : '',
    ].join(' ')}>
      <div className='grid grid-cols-2 gap-3'>
        <button
          className='flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] py-3 font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]'
          type='button'
        >
          <span className='material-symbols-outlined'>shopping_cart</span>
          Sepete Ekle
        </button>
        <button
          className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1A56DB] bg-white py-3 font-bold text-[#1A56DB] transition-all hover:bg-surface-container-low active:scale-[0.98]'
          type='button'
        >
          <span className='material-symbols-outlined'>chat</span>
          Sohbet Et
        </button>
      </div>
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

    const topOffset = 160;
    const nextTop = target.getBoundingClientRect().top + window.scrollY - topOffset;

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

      <main className='mx-auto max-w-[1440px] px-6 py-8'>
        <nav className='mb-6 flex items-center gap-2 text-xs font-medium text-outline'>
          <Link className='hover:text-primary' href='/'>Ana Sayfa</Link>
          <span className='material-symbols-outlined text-sm'>chevron_right</span>
          {categoryTrail.map((item, index) => (
            <span key={item.id} className='flex items-center gap-2'>
              {index < categoryTrail.length - 1 ? (
                <Link className='hover:text-primary' href={`/kategori/${item.slug}`}>
                  {item.name}
                </Link>
              ) : (
                <span className='text-on-surface'>{item.name}</span>
              )}
              {index < categoryTrail.length - 1 ? (
                <span className='material-symbols-outlined text-sm'>chevron_right</span>
              ) : null}
            </span>
          ))}
          <span className='material-symbols-outlined text-sm'>chevron_right</span>
          <span className='text-on-surface'>{listing.name}</span>
        </nav>

        <div className='mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12'>
          <div className='space-y-8 lg:col-span-7'>
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={media.originalName}
                        className={`h-full w-full object-cover ${media.mediaType === 'VIDEO' ? 'opacity-50' : ''}`}
                        src={resolveProductListingMediaUrl(media.id)}
                      />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className='relative aspect-square overflow-hidden rounded-xl border border-outline-variant/30 bg-white'>
                {selectedMedia ? (
                  selectedMedia.mediaType === 'VIDEO' ? (
                    <video
                      className='h-full w-full object-contain'
                      controls
                      src={resolveProductListingMediaUrl(selectedMedia.id)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={listing.name}
                      className='h-full w-full object-contain'
                      src={resolveProductListingMediaUrl(selectedMedia.id)}
                    />
                  )
                ) : (
                  <div className='flex h-full items-center justify-center text-slate-400'>
                    <span className='material-symbols-outlined text-6xl'>inventory_2</span>
                  </div>
                )}

                <button
                  className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-outline shadow-sm'
                  type='button'
                >
                  <span className='material-symbols-outlined'>favorite</span>
                </button>

                <button
                  aria-label='Önceki görsel'
                  className='absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/30 bg-white/85 text-on-surface shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40'
                  disabled={!canNavigateMedia}
                  onClick={goToPreviousMedia}
                  type='button'
                >
                  <span className='material-symbols-outlined'>chevron_left</span>
                </button>
                <button
                  aria-label='Sonraki görsel'
                  className='absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/30 bg-white/85 text-on-surface shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40'
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={media.originalName}
                      className={`h-full w-full object-cover ${media.mediaType === 'VIDEO' ? 'opacity-50' : ''}`}
                      src={resolveProductListingMediaUrl(media.id)}
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <div className='space-y-3'>
              <h3 className='text-sm font-bold text-on-surface'>Öne Çıkan Özellikler</h3>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                {(listing.featuredFeatures.length > 0
                  ? listing.featuredFeatures
                  : [{ title: 'Standart Özellik', description: 'Bu ürün için özellik bilgisi eklenmedi.' }])
                  .slice(0, 4)
                  .map((feature, index) => (
                    <div
                      key={`${feature.title}-${index}`}
                      className='flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-white p-3'
                    >
                      <span className='material-symbols-outlined text-primary'>
                        {index % 2 === 0 ? 'bolt' : 'speed'}
                      </span>
                      <div>
                        <div className='text-[10px] font-bold uppercase tracking-tight text-outline'>
                          {feature.title}
                        </div>
                        <div className='text-xs font-semibold text-on-surface'>
                          {feature.description || feature.title}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className='sticky top-[104px] z-40 mb-2 py-2'>
              <div className='grid max-w-[820px] grid-cols-3 overflow-hidden rounded-xl border border-outline-variant/30 bg-white'>
                <a
                  className={[
                    'flex items-center justify-center border-b-2 px-3 py-4 text-center text-sm font-bold transition-colors',
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
                    'flex items-center justify-center border-b-2 px-3 py-4 text-center text-sm font-bold transition-colors',
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
                    'flex items-center justify-center border-b-2 px-3 py-4 text-center text-sm font-bold transition-colors',
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

            <div className='space-y-8'>
              <section id='description' className='scroll-mt-48 overflow-hidden rounded-2xl border border-outline-variant/30 bg-white'>
                <div className='border-b border-outline-variant/30 bg-surface-container-lowest px-8 py-5'>
                  <h2 className='text-lg font-bold text-on-surface'>Ürün Açıklaması</h2>
                </div>
                <div className='p-8'>
                  <div className='mb-8 grid grid-cols-1 gap-x-16 gap-y-4 md:grid-cols-2'>
                    <div className='flex justify-between border-b border-outline-variant/10 py-3'>
                      <span className='text-sm text-outline'>Model</span>
                      <span className='text-sm font-semibold text-on-surface'>{listing.sku}</span>
                    </div>
                    <div className='flex justify-between border-b border-outline-variant/10 py-3'>
                      <span className='text-sm text-outline'>Kategori</span>
                      <span className='text-sm font-semibold text-on-surface'>{listing.categoryName}</span>
                    </div>
                    <div className='flex justify-between border-b border-outline-variant/10 py-3'>
                      <span className='text-sm text-outline'>Sektör</span>
                      <span className='text-sm font-semibold text-on-surface'>{listing.sectors[0]?.sectorName ?? 'Belirtilmedi'}</span>
                    </div>
                    <div className='flex justify-between border-b border-outline-variant/10 py-3'>
                      <span className='text-sm text-outline'>Stok</span>
                      <span className='text-sm font-semibold text-on-surface'>{listing.stock ?? 0} Adet</span>
                    </div>
                    <div className='flex justify-between border-b border-outline-variant/10 py-3'>
                      <span className='text-sm text-outline'>Teslimat</span>
                      <span className='text-sm font-semibold text-on-surface'>{listing.leadTimeDays ?? '-'} Gün</span>
                    </div>
                    <div className='flex justify-between border-b border-outline-variant/10 py-3'>
                      <span className='text-sm text-outline'>Sertifikalar</span>
                      <span className='text-sm font-semibold text-on-surface'>Tedarikçi Beyanı</span>
                    </div>
                  </div>
                  <div className='text-sm leading-relaxed text-on-surface-variant'>
                    {listing.description}
                  </div>
                </div>
              </section>

              <section id='reviews' className='scroll-mt-48 overflow-hidden rounded-2xl border border-outline-variant/30 bg-white'>
                <div className='border-b border-outline-variant/30 bg-surface-container-lowest px-8 py-5'>
                  <h2 className='text-lg font-bold text-on-surface'>Değerlendirmeler (124)</h2>
                </div>
                <div className='p-8'>
                  <div className='mb-8 flex items-center gap-4'>
                    <div className='text-4xl font-extrabold text-on-surface'>4.8</div>
                    <div>
                      <div className='flex text-[#FF5A1F]'>
                        <span className='material-symbols-outlined'>star</span>
                        <span className='material-symbols-outlined'>star</span>
                        <span className='material-symbols-outlined'>star</span>
                        <span className='material-symbols-outlined'>star</span>
                        <span className='material-symbols-outlined'>star_half</span>
                      </div>
                      <div className='text-xs font-medium text-outline'>124 Global Değerlendirme</div>
                    </div>
                  </div>
                  <div className='border-b border-outline-variant/10 pb-6'>
                    <div className='mb-2 flex justify-between'>
                      <span className='text-sm font-bold'>M*** K.</span>
                      <span className='text-xs text-outline'>2 hafta önce</span>
                    </div>
                    <p className='text-sm text-on-surface-variant'>
                      Endüstriyel saha uygulamalarımızda kusursuz çalışıyor. Isınma problemi hiç yaşamadık. Paketleme çok özenliydi.
                    </p>
                  </div>
                </div>
              </section>

              <section id='company' className='scroll-mt-48 overflow-hidden rounded-2xl border border-outline-variant/30 bg-white'>
                <div className='border-b border-outline-variant/30 bg-surface-container-lowest px-8 py-5'>
                  <h2 className='text-lg font-bold text-on-surface'>Şirket Profili</h2>
                </div>
                <div className='p-8'>
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={media.originalName}
                              className='h-full w-full object-cover'
                              src={resolveProductListingMediaUrl(media.id)}
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

          <aside className='lg:col-span-5 lg:self-start'>
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

      <footer className='mt-16 border-t border-outline-variant/20 bg-surface-container-low py-12'>
        <div className='mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 md:grid-cols-4'>
          <div className='space-y-4'>
            <span className='text-xl font-bold tracking-tighter text-primary'>ToptanNext</span>
            <p className='text-xs leading-relaxed text-outline'>
              Dünyanın dört bir yanındaki güvenilir tedarikçileri kurumsal alıcılarla buluşturan yeni nesil B2B platformu.
            </p>
          </div>
          <div className='space-y-4'>
            <h5 className='text-sm font-bold text-on-surface'>Platform</h5>
            <ul className='space-y-2 text-xs font-medium text-outline'>
              <li>Nasıl Çalışır?</li>
              <li>Güvenlik ve Koruma</li>
              <li>Lojistik Çözümleri</li>
            </ul>
          </div>
          <div className='space-y-4'>
            <h5 className='text-sm font-bold text-on-surface'>Destek</h5>
            <ul className='space-y-2 text-xs font-medium text-outline'>
              <li>Yardım Merkezi</li>
              <li>Satıcı Olun</li>
              <li>Bize Ulaşın</li>
            </ul>
          </div>
          <div className='space-y-4'>
            <h5 className='text-sm font-bold text-on-surface'>Bülten</h5>
            <div className='flex gap-2'>
              <input
                className='flex-1 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary'
                placeholder='E-posta adresi'
                type='email'
              />
              <button className='rounded-lg bg-primary p-2 text-white transition-colors hover:bg-primary-container' type='button'>
                <span className='material-symbols-outlined text-sm'>send</span>
              </button>
            </div>
          </div>
        </div>
        <div className='mx-auto mt-12 max-w-[1440px] border-t border-outline-variant/10 px-6 pt-8 text-center text-[10px] font-medium text-outline'>
          © 2024 ToptanNext Technology Inc. Tüm Hakları Saklıdır.
        </div>
      </footer>
    </div>
  );
}
