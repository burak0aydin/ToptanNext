"use client";

import Link from 'next/link';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import {
  FAVORITES_UPDATED_EVENT,
  isFavoriteProduct,
  toggleFavoriteProduct,
} from '@/lib/favorites';

type ProductCardProps = {
  productId?: string;
  title: string;
  priceLabel: string;
  minOrderQuantity?: number | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  categoryName?: string | null;
  categorySlug?: string | null;
  href?: string;
  className?: string;
};

function ProductCardBody({
  productId,
  title,
  priceLabel,
  minOrderQuantity,
  imageUrl,
  imageUrls,
  categoryName,
  categorySlug,
  href,
}: Omit<ProductCardProps, 'className'>) {
  const images = useMemo(() => {
    const uniqueImages = new Set<string>();

    [...(imageUrls ?? []), imageUrl ?? '']
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .forEach((item) => uniqueImages.add(item));

    return Array.from(uniqueImages);
  }, [imageUrl, imageUrls]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const activeImageUrl = images[activeImageIndex] ?? null;
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setActiveImageIndex(0);
    setImageFailed(false);
  }, [images]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    const syncFavoriteState = () => setIsFavorited(isFavoriteProduct(productId));

    syncFavoriteState();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteState);
    window.addEventListener('storage', syncFavoriteState);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavoriteState);
      window.removeEventListener('storage', syncFavoriteState);
    };
  }, [productId]);

  const goToImage = (event: MouseEvent<HTMLButtonElement>, direction: 'previous' | 'next') => {
    event.preventDefault();
    event.stopPropagation();
    setImageFailed(false);
    setActiveImageIndex((current) => {
      if (direction === 'previous') {
        return current === 0 ? images.length - 1 : current - 1;
      }

      return current === images.length - 1 ? 0 : current + 1;
    });
  };

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId) {
      return;
    }

    const nextIsFavorited = toggleFavoriteProduct({
      id: productId,
      name: title,
      imageUrl: activeImageUrl,
      priceLabel,
      minOrderQuantity: minOrderQuantity ?? null,
      categoryName: categoryName ?? null,
      categorySlug: categorySlug ?? null,
    });

    setIsFavorited(nextIsFavorited);
  };

  return (
    <>
      <div className='relative aspect-square overflow-hidden bg-slate-50'>
        {href ? (
          <Link aria-label={`${title} detayına git`} className='absolute inset-0 z-10' href={href} />
        ) : null}

        {activeImageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={title}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            onError={() => setImageFailed(true)}
            src={activeImageUrl}
          />
        ) : (
          <div className='flex h-full items-center justify-center text-slate-400'>
            <span className='material-symbols-outlined text-5xl'>inventory_2</span>
          </div>
        )}

        {productId ? (
          <button
            aria-label={isFavorited ? 'Favorilerden kaldır' : 'Favorilere ekle'}
            className='absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/95 text-slate-800 opacity-100 shadow-sm transition md:opacity-0 md:group-hover:opacity-100'
            onClick={handleFavoriteClick}
            type='button'
          >
            <span
              className='material-symbols-outlined text-[20px]'
              style={{
                fontVariationSettings: isFavorited
                  ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24",
              }}
            >
              favorite
            </span>
          </button>
        ) : null}

        {hasMultipleImages ? (
          <>
            <button
              aria-label='Önceki ürün görseli'
              className='absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-slate-800 opacity-100 shadow-sm transition md:opacity-0 md:group-hover:opacity-100'
              onClick={(event) => goToImage(event, 'previous')}
              type='button'
            >
              <span className='material-symbols-outlined text-[22px]'>chevron_left</span>
            </button>
            <button
              aria-label='Sonraki ürün görseli'
              className='absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-slate-800 opacity-100 shadow-sm transition md:opacity-0 md:group-hover:opacity-100'
              onClick={(event) => goToImage(event, 'next')}
              type='button'
            >
              <span className='material-symbols-outlined text-[22px]'>chevron_right</span>
            </button>
          </>
        ) : null}
      </div>

      {href ? (
        <Link className='flex flex-1 flex-col p-3 md:p-4' href={href}>
          <h3 className='mb-1 line-clamp-2 text-xs font-medium leading-tight text-on-surface md:mb-2 md:text-sm'>{title}</h3>

          <div className='mt-auto'>
            <div className='mb-1 flex items-baseline gap-1 md:mb-2'>
              <span className='whitespace-nowrap text-sm font-medium text-on-surface md:text-lg'>
                {priceLabel}
              </span>
            </div>
            <span className='inline-flex rounded-xl bg-[#ECEFF3] px-2 py-1 text-[10px] font-medium text-slate-700 md:px-3 md:py-2 md:text-[11px]'>
              MSM: {minOrderQuantity ?? 1} Adet
            </span>
          </div>
        </Link>
      ) : (
        <div className='flex flex-1 flex-col p-3 md:p-4'>
        <h3 className='mb-1 line-clamp-2 text-xs font-medium leading-tight text-on-surface md:mb-2 md:text-sm'>{title}</h3>

        <div className='mt-auto'>
          <div className='mb-1 flex items-baseline gap-1 md:mb-2'>
            <span className='whitespace-nowrap text-sm font-medium text-on-surface md:text-lg'>
              {priceLabel}
            </span>
          </div>
          <span className='inline-flex rounded-xl bg-[#ECEFF3] px-2 py-1 text-[10px] font-medium text-slate-700 md:px-3 md:py-2 md:text-[11px]'>
            MSM: {minOrderQuantity ?? 1} Adet
          </span>
        </div>
        </div>
      )}
    </>
  );
}

export function ProductCard({
  productId,
  title,
  priceLabel,
  minOrderQuantity,
  imageUrl,
  imageUrls,
  categoryName,
  categorySlug,
  href,
  className = '',
}: ProductCardProps) {
  const cardClassName = [
    'group flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md md:rounded-xl',
    className,
  ].join(' ');

  return (
    <article className={cardClassName}>
      <ProductCardBody
        categoryName={categoryName}
        categorySlug={categorySlug}
        href={href}
        imageUrl={imageUrl}
        imageUrls={imageUrls}
        minOrderQuantity={minOrderQuantity}
        priceLabel={priceLabel}
        productId={productId}
        title={title}
      />
    </article>
  );
}
