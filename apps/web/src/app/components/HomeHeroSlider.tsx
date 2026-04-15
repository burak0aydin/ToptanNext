'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type HeroSlide = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  secondaryButtonLabel: string;
};

const SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'Toptan Ticarette Yeni Dönem',
    description:
      'Güvenilir iş ortaklarıyla hızlıca anlaşın, ürün tedarik süreçlerinizi tek platformdan büyütün.',
    imageUrl:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=80',
    imageAlt: 'El sıkışarak anlaşma yapan iş insanları',
    secondaryButtonLabel: 'Sende Satıcı Ol',
  },
  {
    id: 2,
    title: 'Lojistikte Güçlü Çözüm Ortaklığı',
    description:
      'Doğru lojistik partnerleriyle teslimat hızınızı artırın, operasyon maliyetlerinizi verimli şekilde yönetin.',
    imageUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80',
    imageAlt: 'Depo ve lojistik operasyonu',
    secondaryButtonLabel: 'Lojistik Ortağımız Ol',
  },
];

export function HomeHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeSlide = SLIDES[activeIndex];
  const isSellerCta = activeSlide.secondaryButtonLabel
    .toLocaleLowerCase('tr-TR')
    .includes('satıcı ol');

  return (
    <section
      className='relative flex h-[420px] items-center overflow-hidden bg-slate-900'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <img className='h-full w-full object-cover opacity-50' src={slide.imageUrl} alt={slide.imageAlt} />
          <div className='absolute inset-0 bg-slate-900/45' />
        </div>
      ))}

      <div className='container relative z-10 mx-auto px-6'>
        <div className='max-w-2xl'>
          <h1 className='mb-4 text-4xl font-extrabold leading-tight text-white md:text-5xl'>
            {activeSlide.title}
            <span className='ml-2 text-[#0353fe]'>Toptan</span>
            <span className='text-[#FF5A1F] drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]'>Next</span>
          </h1>

          <p className='max-w-xl text-base leading-relaxed text-slate-200 md:text-lg'>
            {activeSlide.description}
          </p>

          <div className='mt-8 flex flex-wrap gap-4'>
            <button
              className='inline-flex w-[280px] items-center justify-center whitespace-nowrap rounded-xl border border-[#5fa4ff89] bg-[rgba(26,87,219,0.07)] px-8 py-3 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-[#1A56DB]'
              type='button'
            >
              Fırsatları Keşfet
            </button>
            {isSellerCta ? (
              <Link
                className='inline-flex w-[280px] items-center justify-center whitespace-nowrap rounded-xl border border-[#ffa17f90] bg-[rgba(255,91,31,0.07)] px-8 py-3 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-[#ff5b1f]'
                href='/satici-ol'
              >
                {activeSlide.secondaryButtonLabel}
              </Link>
            ) : (
              <button
                className='inline-flex w-[280px] items-center justify-center whitespace-nowrap rounded-xl border border-[#ffa17f90] bg-[rgba(255,91,31,0.07)] px-8 py-3 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-[#ff5b1f]'
                type='button'
              >
                {activeSlide.secondaryButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2'>
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            aria-label={`Slayt ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index === activeIndex ? 'bg-white' : 'bg-white/40'
            }`}
            onClick={() => setActiveIndex(index)}
            type='button'
          />
        ))}
      </div>
    </section>
  );
}
