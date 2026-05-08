'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import {
  fetchPublicProductListings,
  resolveProductListingMediaUrl,
  type ProductListingRecord,
} from '@/features/product-listing/api/product-listing.api';

const PAGE_SIZE = 20;

function getCoverImageUrl(listing: ProductListingRecord): string | null {
  const media = listing.media
    .filter((item) => item.mediaType === 'IMAGE')
    .sort((left, right) => left.displayOrder - right.displayOrder)[0];

  return media ? resolveProductListingMediaUrl(media) : null;
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

export function HomeProductFeed() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const productsQuery = useInfiniteQuery({
    queryKey: ['home', 'public-product-listings'],
    queryFn: ({ pageParam }) => fetchPublicProductListings({
      page: pageParam,
      limit: PAGE_SIZE,
      sort: 'LATEST',
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = productsQuery;

  const products = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: '600px 0px',
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  ]);

  return (
    <section className='bg-[#F8FAFC] py-10 md:py-16'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5'>
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className='aspect-[3/4] animate-pulse rounded-lg bg-slate-200 shadow-sm md:rounded-xl'
              />
            ))
            : products.map((product) => (
              <ProductCard
                key={product.id}
                href={`/urun/${product.id}`}
                imageUrl={getCoverImageUrl(product)}
                minOrderQuantity={product.minOrderQuantity}
                priceLabel={buildPriceRange(product)}
                title={product.name}
              />
            ))}
        </div>

        {isError && products.length === 0 ? (
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700'>
            Ürünler yüklenirken bir sorun oluştu.
          </div>
        ) : null}

        {!isLoading && !isError && products.length === 0 ? (
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500'>
            Yayında ürün bulunamadı.
          </div>
        ) : null}

        {hasNextPage ? (
          <div ref={sentinelRef} className='flex h-20 items-center justify-center'>
            {isFetchingNextPage ? (
              <span className='text-sm font-medium text-slate-500'>Ürünler yükleniyor...</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
