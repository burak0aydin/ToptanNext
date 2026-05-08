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
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const listingsQuery = useInfiniteQuery({
    queryKey: ['home', 'published-products'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPublicProductListings({
      page: pageParam,
      limit: PAGE_SIZE,
      sort: 'LATEST',
    }),
    getNextPageParam: (lastPage) => (
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    ),
  });

  const products = useMemo(
    () => listingsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listingsQuery.data?.pages],
  );

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !listingsQuery.hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          listingsQuery.hasNextPage &&
          !listingsQuery.isFetchingNextPage
        ) {
          void listingsQuery.fetchNextPage();
        }
      },
      {
        rootMargin: '640px 0px',
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [
    listingsQuery.fetchNextPage,
    listingsQuery.hasNextPage,
    listingsQuery.isFetchingNextPage,
  ]);

  if (listingsQuery.isLoading) {
    return (
      <section className='bg-[#F8FAFC] py-10 md:py-16'>
        <div className='container mx-auto px-4 sm:px-6'>
          <div className='grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5'>
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className='aspect-[3/4] animate-pulse rounded-lg bg-slate-200 shadow-sm md:rounded-xl'
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listingsQuery.isError) {
    return (
      <section className='bg-[#F8FAFC] py-10 md:py-16'>
        <div className='container mx-auto px-4 sm:px-6'>
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            Ürünler yüklenirken bir sorun oluştu.
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className='bg-[#F8FAFC] py-8'>
        <div className='container mx-auto px-4 sm:px-6'>
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500'>
            Şu anda yayında ürün bulunmuyor.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='bg-[#F8FAFC] py-10 md:py-16'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5'>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              className='bg-surface-container-lowest'
              href={`/urun/${product.id}`}
              imageUrl={getCoverImageUrl(product)}
              minOrderQuantity={product.minOrderQuantity}
              priceLabel={buildPriceRange(product)}
              title={product.name}
            />
          ))}
        </div>

        {listingsQuery.hasNextPage ? (
          <div ref={loadMoreRef} className='h-12' aria-hidden='true' />
        ) : null}

        {listingsQuery.isFetchingNextPage ? (
          <div className='mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className='aspect-[3/4] animate-pulse rounded-lg bg-slate-200 shadow-sm md:rounded-xl'
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
