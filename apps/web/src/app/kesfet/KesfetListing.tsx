"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MainFooter } from '@/app/components/MainFooter';
import { MainHeader } from '@/app/components/MainHeader';
import { ProductCard } from '@/app/components/ProductCard';
import {
  fetchCategoriesTree,
  fetchPublicProductListings,
  resolveProductListingMediaUrl,
  type CategoryTreeNode,
  type PublicProductListingMsmRange,
  type PublicProductListingSort,
  type ProductListingRecord,
} from '@/features/product-listing/api/product-listing.api';

const PAGE_SIZE = 24;

type KesfetListingProps = {
  slug?: string | null;
};

function getCoverImageUrl(listing: ProductListingRecord): string | null {
  const media = listing.media
    .filter((item) => item.mediaType === 'IMAGE')
    .sort((left, right) => left.displayOrder - right.displayOrder)[0];

  return media ? resolveProductListingMediaUrl(media.id) : null;
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

function findCategoryBySlug(nodes: CategoryTreeNode[], slug: string): CategoryTreeNode | null {
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

function findCategoryTrailBySlug(nodes: CategoryTreeNode[], slug: string): CategoryTreeNode[] {
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

export function KesfetListing({ slug }: KesfetListingProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<PublicProductListingSort>('LATEST');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [msmRange, setMsmRange] = useState<PublicProductListingMsmRange>('ANY');

  const normalizedMinPriceInput = minPriceInput.trim();
  const normalizedMaxPriceInput = maxPriceInput.trim();
  const parsedMinPrice = normalizedMinPriceInput.length > 0 ? Number(normalizedMinPriceInput) : null;
  const parsedMaxPrice = normalizedMaxPriceInput.length > 0 ? Number(normalizedMaxPriceInput) : null;

  const categoriesQuery = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: fetchCategoriesTree,
    staleTime: 5 * 60_000,
  });

  const selectedCategory = useMemo(() => {
    if (!slug) {
      return null;
    }

    return findCategoryBySlug(categoriesQuery.data ?? [], slug);
  }, [categoriesQuery.data, slug]);

  const categoryTrail = useMemo(() => {
    if (!slug) {
      return [];
    }

    return findCategoryTrailBySlug(categoriesQuery.data ?? [], slug);
  }, [categoriesQuery.data, slug]);

  const listQuery = useQuery({
    queryKey: [
      'public',
      'discover',
      page,
      slug ?? 'all',
      sort,
      minPriceInput,
      maxPriceInput,
      msmRange,
    ],
    queryFn: () => fetchPublicProductListings({
      page,
      limit: PAGE_SIZE,
      sort,
      categoryIds: selectedCategory ? [selectedCategory.id] : undefined,
      minPrice: parsedMinPrice !== null && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0
        ? parsedMinPrice
        : undefined,
      maxPrice: parsedMaxPrice !== null && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0
        ? parsedMaxPrice
        : undefined,
      msmRange,
    }),
  });

  const items = listQuery.data?.items ?? [];
  const title = selectedCategory?.name ?? 'Keşfet';

  return (
    <div className='bg-surface text-on-surface'>
      <MainHeader />

      <main className='min-h-[calc(100vh-104px)] pb-24 lg:pb-0'>
        <div className='mx-auto max-w-[1440px] px-4 py-3 sm:px-6'>
          <nav className='mb-4 flex items-center gap-1 overflow-x-auto whitespace-nowrap text-xs font-medium text-outline'>
          {categoryTrail.length > 0 ? (
            categoryTrail.map((item, index) => {
              const isLast = index === categoryTrail.length - 1;

              return (
                <span key={item.id} className='flex items-center gap-1 whitespace-nowrap'>
                  <Link className='hover:text-primary whitespace-nowrap' href={`/kesfet/${item.slug}`}>
                    {item.name}
                  </Link>
                  {!isLast ? (
                    <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
                  ) : null}
                </span>
              );
            })
          ) : null}
          </nav>

          <div className='mb-5 flex w-full items-center gap-2 sm:gap-4'>
            <div className='flex min-w-0 flex-1 items-center gap-2'>
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
              aria-expanded={isFilterPanelOpen}
              onClick={() => setIsFilterPanelOpen((current) => !current)}
            >
              <span className='flex items-center gap-2'>
                <span className='material-symbols-outlined text-[20px]'>filter_list</span>
                Filtreler
              </span>
            </button>
          </div>

          {isFilterPanelOpen ? (
            <section className='mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <div>
                  <label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-outline'>
                    Min Fiyat
                  </label>
                  <input
                    className='h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003FB1] focus:bg-white focus:ring-2 focus:ring-blue-100'
                    type='number'
                    placeholder='0'
                    value={minPriceInput}
                    onChange={(event) => {
                      setMinPriceInput(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div>
                  <label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-outline'>
                    Max Fiyat
                  </label>
                  <input
                    className='h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003FB1] focus:bg-white focus:ring-2 focus:ring-blue-100'
                    type='number'
                    placeholder='100000'
                    value={maxPriceInput}
                    onChange={(event) => {
                      setMaxPriceInput(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div>
                  <label className='mb-2 block text-xs font-semibold uppercase tracking-wide text-outline'>
                    Min. Sipariş
                  </label>
                  <select
                    className='h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-[#003FB1] focus:bg-white focus:ring-2 focus:ring-blue-100'
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
                </div>
              </div>
            </section>
          ) : null}

          <div className='grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5'>
          {listQuery.isLoading
            ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className='aspect-[3/4] animate-pulse rounded-lg bg-slate-200 shadow-sm md:rounded-xl' />
            ))
            : items.map((item) => {
              const imageUrl = getCoverImageUrl(item);

              return (
                <ProductCard
                  key={item.id}
                  href={`/urun/${item.id}`}
                  imageUrl={imageUrl}
                  minOrderQuantity={item.minOrderQuantity}
                  priceLabel={buildPriceRange(item)}
                  title={item.name}
                />
              );
            })}
          </div>

          {!listQuery.isLoading && items.length === 0 ? (
            <div className='mt-6 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500'>
              Yayınlanmış ürün bulunamadı.
            </div>
          ) : null}
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
