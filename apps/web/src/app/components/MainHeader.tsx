"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { requestJson } from '@/lib/api';
import { AccountNavLink } from './AccountNavLink';

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: CategoryNode[];
};

type SectorItem = {
  id: string;
  name: string;
  slug: string;
};

async function fetchCategoryTree(): Promise<CategoryNode[]> {
  return requestJson<CategoryNode[]>('/categories');
}

async function fetchSectors(): Promise<SectorItem[]> {
  return requestJson<SectorItem[]>('/sectors');
}

export function MainHeader() {
  const [desktopMenu, setDesktopMenu] = useState<'categories' | 'sectors' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileSectorOpen, setMobileSectorOpen] = useState(false);

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['nav', 'categories'],
    queryFn: fetchCategoryTree,
  });

  const {
    data: sectors = [],
    isLoading: isSectorsLoading,
    isError: isSectorsError,
  } = useQuery({
    queryKey: ['nav', 'sectors'],
    queryFn: fetchSectors,
  });

  const categoryRoots = categories.slice(0, 6);
  const sectorItems = sectors.slice(0, 16);

  return (
    <header className='sticky top-0 z-50 border-b border-slate-100 bg-white shadow-sm'>
      <nav className='relative mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-3'>
        <Link className='text-2xl font-bold tracking-tighter text-[#003FB1]' href='/'>
          Toptan<span className='text-[#FF5A1F]'>Next</span>
        </Link>

        <div className='mx-12 hidden max-w-3xl flex-1 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 lg:flex'>
          <span className='material-symbols-outlined text-outline'>search</span>
          <input
            className='w-full border-none bg-transparent text-sm text-on-surface-variant focus:ring-0'
            placeholder='Ürün, kategori veya marka ara...'
            type='text'
          />
        </div>

        <div className='flex items-center gap-6'>
          <button
            aria-label='Menü'
            className='flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95 lg:hidden'
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            type='button'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>menu</span>
          </button>

          <button
            aria-label='Mesajlar'
            className='flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
            type='button'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>forum</span>
          </button>

          <button
            aria-label='Sepetim'
            className='flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
            type='button'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>shopping_cart</span>
          </button>

          <AccountNavLink />
        </div>
      </nav>

      <div className='relative border-b border-slate-200/50 bg-slate-50'>
        <div
          className='mx-auto flex min-h-10 max-w-[1920px] items-center justify-between px-6'
          onMouseLeave={() => setDesktopMenu(null)}
        >
          <div className='hidden items-center gap-8 lg:flex'>
            <button
              className='flex items-center gap-2 py-2 text-sm font-semibold text-on-surface transition-colors hover:text-primary'
              onMouseEnter={() => setDesktopMenu('categories')}
              type='button'
            >
              <span className='material-symbols-outlined text-[20px]'>menu</span>
              Kategoriler
            </button>

            <button
              className='py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary'
              onMouseEnter={() => setDesktopMenu('sectors')}
              type='button'
            >
              Sektörler
            </button>

            <a className='py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              Lojistik Çözümler
            </a>
            <a className='py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              ToptanNext'te Satış Yap
            </a>
          </div>

          <div className='hidden items-center gap-4 lg:flex'>
            <a className='text-[10px] font-bold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              App Store
            </a>
            <a className='text-[10px] font-bold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              Play Store
            </a>
          </div>
        </div>

        {desktopMenu === 'categories' ? (
          <div
            className='absolute left-0 top-full z-50 hidden w-full border-t border-slate-200 bg-white shadow-lg lg:block'
            onMouseEnter={() => setDesktopMenu('categories')}
          >
            <div className='mx-auto grid max-w-[1920px] grid-cols-3 gap-6 px-6 py-6'>
              {isCategoriesLoading ? (
                <p className='col-span-3 text-sm text-slate-500'>Kategoriler yükleniyor...</p>
              ) : null}

              {isCategoriesError ? (
                <p className='col-span-3 text-sm text-red-600'>Kategoriler yüklenirken hata oluştu.</p>
              ) : null}

              {categoryRoots.map((root) => (
                <div key={root.id} className='space-y-3 rounded-xl border border-slate-100 p-4'>
                  <p className='text-sm font-bold text-[#003FB1]'>{root.name}</p>
                  <div className='space-y-3'>
                    {root.children.slice(0, 5).map((child) => (
                      <div key={child.id} className='space-y-1'>
                        <p className='text-xs font-semibold text-slate-800'>{child.name}</p>
                        <div className='flex flex-wrap gap-2'>
                          {child.children.slice(0, 6).map((leaf) => (
                            <span
                              key={leaf.id}
                              className='rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600'
                            >
                              {leaf.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {desktopMenu === 'sectors' ? (
          <div
            className='absolute left-0 top-full z-50 hidden w-full border-t border-slate-200 bg-white shadow-lg lg:block'
            onMouseEnter={() => setDesktopMenu('sectors')}
          >
            <div className='mx-auto max-w-[1920px] px-6 py-6'>
              {isSectorsLoading ? <p className='text-sm text-slate-500'>Sektörler yükleniyor...</p> : null}
              {isSectorsError ? (
                <p className='text-sm text-red-600'>Sektörler yüklenirken hata oluştu.</p>
              ) : null}
              <div className='grid grid-cols-4 gap-3'>
                {sectorItems.map((sector) => (
                  <a
                    key={sector.id}
                    className='rounded-lg border border-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-primary/30 hover:text-primary'
                    href='#'
                  >
                    {sector.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {mobileMenuOpen ? (
          <div className='border-t border-slate-200 bg-white lg:hidden'>
            <div className='space-y-2 px-4 py-3'>
              <button
                className='flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800'
                onClick={() => setMobileCategoryOpen((prev) => !prev)}
                type='button'
              >
                Kategoriler
                <span className='material-symbols-outlined text-base'>
                  {mobileCategoryOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {mobileCategoryOpen ? (
                <div className='space-y-2 rounded-lg border border-slate-100 p-3'>
                  {categoryRoots.map((root) => (
                    <div key={root.id} className='space-y-1'>
                      <p className='text-sm font-semibold text-[#003FB1]'>{root.name}</p>
                      <p className='text-xs text-slate-500'>
                        {root.children.slice(0, 4).map((item) => item.name).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                className='flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800'
                onClick={() => setMobileSectorOpen((prev) => !prev)}
                type='button'
              >
                Sektörler
                <span className='material-symbols-outlined text-base'>
                  {mobileSectorOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {mobileSectorOpen ? (
                <div className='grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-3'>
                  {sectorItems.map((sector) => (
                    <span
                      key={sector.id}
                      className='rounded-md bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700'
                    >
                      {sector.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
