'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MainFooter } from '@/app/components/MainFooter';
import { MainHeader } from '@/app/components/MainHeader';
import { ProductCard } from '@/app/components/ProductCard';
import {
  fetchCategoriesTree,
  fetchPublicProductListings,
  fetchSectors,
  resolveProductListingMediaUrl,
  type CategoryTreeNode,
  type ProductListingRecord,
  type PublicProductListingMsmRange,
  type PublicProductListingSort,
  type SectorRecord,
} from '@/features/product-listing/api/product-listing.api';

type PublicListingMode = 'category' | 'sector';

type PublicListingViewProps = {
  mode: PublicListingMode;
  slug: string;
};

const PAGE_SIZE = 8;

function collectCategoryIds(node: CategoryTreeNode): string[] {
  return [node.id, ...node.children.flatMap((child) => collectCategoryIds(child))];
}

function findCategoryBySlug(
  nodes: CategoryTreeNode[],
  slug: string,
): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.slug === slug) {
      return node;
    }

    const nested = findCategoryBySlug(node.children, slug);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function findCategoryTrailBySlug(
  nodes: CategoryTreeNode[],
  slug: string,
): CategoryTreeNode[] {
  for (const node of nodes) {
    if (node.slug === slug) {
      return [node];
    }

    const nested = findCategoryTrailBySlug(node.children, slug);
    if (nested.length > 0) {
      return [node, ...nested];
    }
  }

  return [];
}

function getCoverImageUrl(listing: ProductListingRecord): string | null {
  return getProductImageUrls(listing)[0] ?? null;
}

function getProductImageUrls(listing: ProductListingRecord): string[] {
  const media = listing.media
    .filter((item) => item.mediaType === 'IMAGE')
    .sort((left, right) => left.displayOrder - right.displayOrder);

  return media.map((item) => resolveProductListingMediaUrl(item));
}

function formatTryAmount(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildPriceRange(listing: ProductListingRecord): string {
  const tierPrices = listing.pricingTiers
    .map((tier) => Number(tier.unitPrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (tierPrices.length > 0) {
    const min = Math.min(...tierPrices);
    const max = Math.max(...tierPrices);
    return min === max
      ? formatTryAmount(min)
      : `${formatTryAmount(min)} - ${formatTryAmount(max)}`;
  }

  const basePrice = Number(listing.basePrice);
  if (Number.isFinite(basePrice) && basePrice > 0) {
    return formatTryAmount(basePrice);
  }

  return 'Fiyat sorunuz';
}

function buildPaginationPages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
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

export function PublicListingView({ mode, slug }: PublicListingViewProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<PublicProductListingSort>('LATEST');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [msmRange, setMsmRange] = useState<PublicProductListingMsmRange>('ANY');

  const categoriesQuery = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: fetchCategoriesTree,
    staleTime: 5 * 60_000,
  });

  const sectorsQuery = useQuery({
    queryKey: ['public', 'sectors'],
    queryFn: fetchSectors,
    staleTime: 5 * 60_000,
  });

  const selectedCategory = useMemo(() => {
    if (mode !== 'category') {
      return null;
    }

    return findCategoryBySlug(categoriesQuery.data ?? [], slug);
  }, [categoriesQuery.data, mode, slug]);

  const categoryTrail = useMemo(() => {
    if (mode !== 'category') {
      return [];
    }

    return findCategoryTrailBySlug(categoriesQuery.data ?? [], slug);
  }, [categoriesQuery.data, mode, slug]);

  const categoryIds = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    return collectCategoryIds(selectedCategory);
  }, [selectedCategory]);

  const selectedSector = useMemo<SectorRecord | null>(() => {
    if (mode !== 'sector') {
      return null;
    }

    return (sectorsQuery.data ?? []).find((sector) => sector.slug === slug) ?? null;
  }, [mode, sectorsQuery.data, slug]);

  const normalizedMinPriceInput = minPriceInput.trim();
  const normalizedMaxPriceInput = maxPriceInput.trim();
  const parsedMinPrice = normalizedMinPriceInput.length > 0 ? Number(normalizedMinPriceInput) : null;
  const parsedMaxPrice = normalizedMaxPriceInput.length > 0 ? Number(normalizedMaxPriceInput) : null;

  const listQuery = useQuery({
    queryKey: [
      'public',
      'published-listings',
      mode,
      slug,
      page,
      sort,
      categoryIds.join(','),
      selectedSector?.id ?? '',
      minPriceInput,
      maxPriceInput,
      msmRange,
    ],
    queryFn: () => fetchPublicProductListings({
      page,
      limit: PAGE_SIZE,
      sort,
      categoryIds: mode === 'category' ? categoryIds : undefined,
      sectorId: mode === 'sector' ? (selectedSector?.id ?? undefined) : undefined,
      minPrice: parsedMinPrice !== null && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0
        ? parsedMinPrice
        : undefined,
      maxPrice: parsedMaxPrice !== null && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0
        ? parsedMaxPrice
        : undefined,
      msmRange,
    }),
    enabled:
      !categoriesQuery.isLoading
      && !sectorsQuery.isLoading
      && ((mode === 'category' && categoryIds.length > 0) || (mode === 'sector' && Boolean(selectedSector?.id))),
  });

  const title = mode === 'category'
    ? (selectedCategory?.name ?? 'Kategori')
    : (selectedSector?.name ?? 'Sektör');

  const noMatch =
    (!categoriesQuery.isLoading && mode === 'category' && !selectedCategory)
    || (!sectorsQuery.isLoading && mode === 'sector' && !selectedSector);

  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const pageItems = buildPaginationPages(page, totalPages);
  const filterPanelId = 'public-listing-filters-panel';

  return (
    <div className='bg-surface text-on-surface'>
      <MainHeader />

      <div
        className={[
          'flex min-h-[calc(100vh-104px)] transition-[padding] duration-300',
          isFilterPanelOpen ? 'md:pl-[320px]' : 'md:pl-0',
        ].join(' ')}
      >
        <main className='flex-1 bg-surface p-6 lg:p-10'>
          <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <nav className='mb-2 flex items-center gap-1 text-xs font-medium text-outline overflow-x-auto flex-nowrap'>
              {mode === 'category' && categoryTrail.length > 0 ? (
                categoryTrail.map((category, index) => {
                  const isLast = index === categoryTrail.length - 1;

                  return (
                    <span key={category.id} className='flex items-center gap-1 whitespace-nowrap'>
                      <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
                      {isLast ? (
                        <span className='text-on-surface'>{formatBreadcrumbLabel(category.name)}</span>
                      ) : (
                        <Link className='hover:text-primary whitespace-nowrap' href={`/kategori/${category.slug}`}>
                          {formatBreadcrumbLabel(category.name)}
                        </Link>
                      )}
                    </span>
                  );
                })
              ) : (
                <>
                  <span className='material-symbols-outlined text-sm'>chevron_right</span>
                  <span className='text-on-surface'>{title}</span>
                </>
              )}
            </nav>

            <div className='flex w-full items-center gap-2 sm:w-auto sm:gap-4'>
              <div className='flex min-w-0 flex-1 items-center gap-2 sm:flex-none'>
                <span className='text-xs font-semibold uppercase text-outline'>Sıralama:</span>
                <select
                  className='w-full min-w-0 cursor-pointer rounded-xl border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-primary-container sm:w-[220px] sm:px-4'
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as PublicProductListingSort);
                    setPage(1);
                  }}
                >
                  <option value='LATEST'>En Yeni</option>
                  <option value='PRICE_ASC'>Fiyat: Düşükten Yükseğe</option>
                  <option value='PRICE_DESC'>Fiyat: Yüksekten Düşüğe</option>
                </select>
              </div>

              <button
                className='shrink-0 rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-low hover:text-primary sm:px-4'
                type='button'
                aria-controls={filterPanelId}
                aria-expanded={isFilterPanelOpen}
                onClick={() => setIsFilterPanelOpen((current) => !current)}
              >
                <span className='flex items-center gap-2'>
                  <span className='material-symbols-outlined text-[20px]'>filter_list</span>
                  Filtreler
                </span>
              </button>
            </div>
          </div>

          {noMatch ? (
            <div className='mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
              Seçilen kategori/sektör bulunamadı.
            </div>
          ) : null}

          {listQuery.isError ? (
            <div className='mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              Ürünler yüklenirken hata oluştu.
            </div>
          ) : null}

          <div className='grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4'>
            {listQuery.isLoading
              ? Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={index} className='aspect-[3/4] animate-pulse rounded-lg bg-slate-200 shadow-sm md:rounded-xl' />
              ))
              : items.map((item) => {
                const imageUrl = getCoverImageUrl(item);

                return (
                  <ProductCard
                    key={item.id}
                    categoryName={item.categoryName}
                    href={`/urun/${item.id}`}
                    imageUrl={imageUrl}
                    imageUrls={getProductImageUrls(item)}
                    minOrderQuantity={item.minOrderQuantity}
                    priceLabel={buildPriceRange(item)}
                    productId={item.id}
                    title={item.name}
                    className='bg-surface-container-lowest'
                  />
                );
              })}
          </div>

          {!listQuery.isLoading && items.length === 0 ? (
            <div className='mt-6 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500'>
              Bu filtrelerde yayınlanmış ürün bulunamadı.
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div className='mt-12 flex justify-center'>
              <div className='flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm'>
                <button
                  className='p-2 text-outline transition-colors hover:text-primary disabled:opacity-40'
                  type='button'
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className='material-symbols-outlined'>chevron_left</span>
                </button>

                {pageItems.map((entry, index) => (
                  entry === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className='px-1 text-outline'>...</span>
                  ) : (
                    <button
                      key={entry}
                      className={[
                        'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                        page === entry
                          ? 'bg-primary font-bold text-white'
                          : 'text-on-surface-variant hover:bg-surface-container',
                      ].join(' ')}
                      type='button'
                      onClick={() => setPage(entry)}
                    >
                      {entry}
                    </button>
                  )
                ))}

                <button
                  className='p-2 text-outline transition-colors hover:text-primary disabled:opacity-40'
                  type='button'
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <span className='material-symbols-outlined'>chevron_right</span>
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <aside
        id={filterPanelId}
        className={[
          'fixed left-0 top-[104px] z-[70] h-[calc(100vh-104px)] w-full max-w-[320px] border-r border-slate-200 bg-[#F4F5F7] p-6 shadow-2xl transition-transform duration-300',
          isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className='mb-6 border-t border-[#D7DBE2] pt-7'>
          <h4 className='mb-7 text-[12px] font-extrabold uppercase tracking-wider text-[#B6BACD]'>
            Filtreler
          </h4>

          <div className='space-y-8'>
            <div>
              <label className='mb-3 block text-[16px] font-semibold leading-none text-[#1E232A]'>
                Fiyat Aralığı (₺)
              </label>
              <div className='flex gap-3'>
                <input
                  className='h-12 w-full rounded-2xl border-none bg-[#E8EBF0] px-4 text-[14px] font-medium text-[#9098A7] placeholder:text-[#9098A7] focus:ring-0'
                  type='number'
                  placeholder='Min'
                  value={minPriceInput}
                  onChange={(event) => {
                    setMinPriceInput(event.target.value);
                    setPage(1);
                  }}
                />
                <input
                  className='h-12 w-full rounded-2xl border-none bg-[#E8EBF0] px-4 text-[14px] font-medium text-[#9098A7] placeholder:text-[#9098A7] focus:ring-0'
                  type='number'
                  placeholder='Max'
                  value={maxPriceInput}
                  onChange={(event) => {
                    setMaxPriceInput(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div>
              <label className='mb-3 block text-[16px] font-semibold leading-none text-[#1E232A]'>
                Min. Sipariş (MSM)
              </label>
              <div className='relative'>
                <select
                  className='h-12 w-full appearance-none rounded-2xl border-none bg-[#E8EBF0] px-4 pr-12 text-[14px] font-medium text-[#1E232A] focus:ring-0'
                  value={msmRange}
                  onChange={(event) => {
                    setMsmRange(event.target.value as PublicProductListingMsmRange);
                    setPage(1);
                  }}
                >
                  <option value='ANY'>Herhangi</option>
                  <option value='RANGE_1_100'>1 - 100</option>
                  <option value='RANGE_100_500'>100 - 500</option>
                  <option value='RANGE_500_PLUS'>500+</option>
                </select>
                <span className='material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[20px] text-[#1E232A]'>
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <MainFooter />
    </div>
  );
}
