'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { requestJson } from '@/lib/api';

type SectorItem = {
  id: string;
  name: string;
  slug: string;
};

const DEFAULT_SECTOR_IMAGE =
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=320&q=80';

const SECTOR_IMAGE_MATCHERS: Array<{ keywords: string[]; image: string }> = [
  {
    keywords: ['otel', 'pansiyon'],
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['kafe', 'restoran'],
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['supermarket', 'market'],
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['giyim-magazalari', 'giyim'],
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['elektronik'],
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['kozmetik'],
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['petshop', 'kedi', 'kopek'],
    image:
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['spor', 'salon'],
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['hastane'],
    image:
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['eczane'],
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['ofis'],
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['oto', 'servis'],
    image:
      'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['lojistik'],
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['okul'],
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['organizasyon'],
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=320&q=80',
  },
  {
    keywords: ['insaat'],
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=320&q=80',
  },
];

async function fetchSectors(): Promise<SectorItem[]> {
  return requestJson<SectorItem[]>('/sectors');
}

function getSectorImage(slug: string): string {
  for (const matcher of SECTOR_IMAGE_MATCHERS) {
    if (matcher.keywords.some((keyword) => slug.includes(keyword))) {
      return matcher.image;
    }
  }

  return DEFAULT_SECTOR_IMAGE;
}

export function FeaturedSectorsCarousel() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const {
    data: sectors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['home', 'featured-sectors'],
    queryFn: fetchSectors,
  });

  const scrollByOneCard = useCallback((direction: 'left' | 'right') => {
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }

    const firstCard = slider.querySelector('[data-sector-card]') as HTMLElement | null;
    const styles = window.getComputedStyle(slider);
    const gap = Number.parseFloat(styles.gap || styles.columnGap || '0');
    const cardWidth = firstCard?.offsetWidth ?? 112;
    const distance = cardWidth + gap;
    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

    if (direction === 'right') {
      if (slider.scrollLeft + distance >= maxScrollLeft - 4) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      slider.scrollBy({ left: distance, behavior: 'smooth' });
      return;
    }

    if (slider.scrollLeft <= 4) {
      slider.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
      return;
    }

    slider.scrollBy({ left: -distance, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isPaused || isLoading || isError || sectors.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      scrollByOneCard('right');
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused, isLoading, isError, sectors.length, scrollByOneCard]);

  return (
    <section
      className='bg-white pb-10 pt-6'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className='container mx-auto px-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-on-surface'>Öne Çıkan Sektörler</h2>
          <div className='flex items-center gap-2'>
            <button
              aria-label='Sektörleri sola kaydır'
              className='flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant transition-colors hover:bg-slate-50'
              onClick={() => scrollByOneCard('left')}
              type='button'
            >
              <span className='material-symbols-outlined'>chevron_left</span>
            </button>
            <button
              aria-label='Sektörleri sağa kaydır'
              className='flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant transition-colors hover:bg-slate-50'
              onClick={() => scrollByOneCard('right')}
              type='button'
            >
              <span className='material-symbols-outlined'>chevron_right</span>
            </button>
          </div>
        </div>

        {isLoading ? <p className='text-sm text-slate-500'>Sektörler yükleniyor...</p> : null}
        {isError ? <p className='text-sm text-red-600'>Sektörler yüklenirken hata oluştu.</p> : null}

        {!isLoading && !isError ? (
          <div
            ref={sliderRef}
            className='hide-scrollbar flex gap-8 overflow-x-auto overflow-y-visible px-1 pb-7 pt-7 pr-3 scroll-smooth'
          >
            {sectors.map((sector) => (
              <Link
                key={sector.id}
                className='group relative flex w-[calc((100%-14rem)/8)] min-w-[112px] shrink-0 origin-center flex-col items-center gap-3 transition-transform duration-200 hover:z-10 hover:scale-125 last:mr-2'
                data-sector-card
                href={`/sektorler/${sector.slug}`}
              >
                <div className='h-20 w-20 overflow-hidden rounded-full border-2 border-transparent bg-surface-container-low shadow-sm transition-all group-hover:border-primary'>
                  <img
                    className='h-full w-full object-cover'
                    src={getSectorImage(sector.slug)}
                    alt={sector.name}
                  />
                </div>
                <span className='text-center text-xs font-semibold text-on-surface group-hover:text-primary'>
                  {sector.name}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
