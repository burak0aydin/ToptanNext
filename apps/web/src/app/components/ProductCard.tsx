"use client";

import Link from 'next/link';
import { useState } from 'react';

type ProductCardProps = {
  title: string;
  priceLabel: string;
  minOrderQuantity?: number | null;
  imageUrl?: string | null;
  href?: string;
  className?: string;
};

function ProductCardBody({
  title,
  priceLabel,
  minOrderQuantity,
  imageUrl,
}: Omit<ProductCardProps, 'href' | 'className'>) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <>
      <div className='aspect-square overflow-hidden bg-slate-50'>
        {imageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={title}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            onError={() => setImageFailed(true)}
            src={imageUrl}
          />
        ) : (
          <div className='flex h-full items-center justify-center text-slate-400'>
            <span className='material-symbols-outlined text-5xl'>inventory_2</span>
          </div>
        )}
      </div>

      <div className='flex flex-1 flex-col p-3 md:p-4'>
        <h3 className='mb-1 line-clamp-2 text-xs font-medium leading-tight text-on-surface md:mb-2 md:text-sm'>
          {title}
        </h3>

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
    </>
  );
}

export function ProductCard({
  title,
  priceLabel,
  minOrderQuantity,
  imageUrl,
  href,
  className = '',
}: ProductCardProps) {
  const cardClassName = [
    'group flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md md:rounded-xl',
    className,
  ].join(' ');

  if (href) {
    return (
      <Link className={cardClassName} href={href}>
        <ProductCardBody
          imageUrl={imageUrl}
          minOrderQuantity={minOrderQuantity}
          priceLabel={priceLabel}
          title={title}
        />
      </Link>
    );
  }

  return (
    <article className={cardClassName}>
      <ProductCardBody
        imageUrl={imageUrl}
        minOrderQuantity={minOrderQuantity}
        priceLabel={priceLabel}
        title={title}
      />
    </article>
  );
}
