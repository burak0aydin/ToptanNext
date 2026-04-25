"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { requestJson } from '@/lib/api';
import { hasAccessToken } from '@/lib/auth-token';
import { fetchCart } from '@/features/cart/api/cart.api';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { fetchMySupplierApplication } from '@/features/supplier-application/api/supplier-application.api';
import { AccountNavLink } from './AccountNavLink';
import {
  CategoryMegaMenu,
  type CategoryMegaMenuCategory,
} from './CategoryMegaMenu';

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
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileSectorOpen, setMobileSectorOpen] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems);
  const setTotalItems = useCartStore((state) => state.setTotalItems);
  const toast = useCartStore((state) => state.toast);
  const clearToast = useCartStore((state) => state.clearToast);

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

  const {
    data: mySupplierApplication,
  } = useQuery({
    queryKey: ['nav', 'supplier-application', 'me'],
    queryFn: fetchMySupplierApplication,
    enabled: hasAccessToken(),
    retry: false,
  });

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: hasAccessToken(),
    retry: false,
  });

  useEffect(() => {
    if (cartQuery.data) {
      setTotalItems(cartQuery.data.totalItems);
      return;
    }

    if (!hasAccessToken()) {
      setTotalItems(0);
    }
  }, [cartQuery.data, setTotalItems]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearToast();
    }, 2600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [clearToast, toast]);

  const supplierApplyHref = mySupplierApplication
    ? '/satici-ol/basvuru-sonucu'
    : '/satici-ol';

  const categoryMenuData = useMemo<CategoryMegaMenuCategory[]>(() => {
    return categories.map((root) => ({
      id: root.id,
      name: root.name,
      href: `/kategori/${root.slug}`,
      groups: root.children.map((group) => ({
        id: group.id,
        title: group.name,
        href: `/kategori/${group.slug}`,
        items: group.children.map((item) => ({
          id: item.id,
          name: item.name,
          href: `/kategori/${item.slug}`,
        })),
      })),
    }));
  }, [categories]);

  const categoryRoots = categoryMenuData.slice(0, 10);
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

          <Link
            aria-label='Mesajlar'
            className='flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
            href='/messages'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>forum</span>
          </Link>

          <div className='relative'>
            <Link
              aria-label='Sepetim'
              className='relative flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
              href='/sepet'
            >
              <span className='material-symbols-outlined text-[28px] leading-none'>shopping_cart</span>
              {totalItems > 0 ? (
                <span className='absolute -right-2 -top-2 min-w-[18px] rounded-full bg-[#1A56DB] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white'>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              ) : null}
            </Link>

            {toast ? (
              <div className='absolute right-0 top-[calc(100%+10px)] w-[220px] rounded-xl border border-[#D7E4FF] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg'>
                {toast.message}
              </div>
            ) : null}
          </div>

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

            <Link
              className='py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary'
              href={supplierApplyHref}
            >
              Satıcı Ol
            </Link>
            <Link
              className='py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary'
              href='/lojistik'
            >
              Lojistik
            </Link>
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
            className='absolute left-0 right-0 top-full z-50 hidden w-full border-t border-slate-200 bg-white shadow-lg lg:block'
            onMouseEnter={() => setDesktopMenu('categories')}
            onMouseLeave={() => setDesktopMenu(null)}
          >
            <CategoryMegaMenu
              categories={categoryMenuData}
              isError={isCategoriesError}
              isLoading={isCategoriesLoading}
            />
          </div>
        ) : null}

        {desktopMenu === 'sectors' ? (
          <div
            className='absolute left-0 top-full z-50 hidden w-full border-t border-slate-200 bg-white shadow-lg lg:block'
            onMouseEnter={() => setDesktopMenu('sectors')}
            onMouseLeave={() => {
              setDesktopMenu(null);
              setActiveSectorId(null);
            }}
          >
            <div className='mx-auto max-w-[1920px] px-6 py-6'>
              {isSectorsLoading ? <p className='text-sm text-slate-500'>Sektörler yükleniyor...</p> : null}
              {isSectorsError ? (
                <p className='text-sm text-red-600'>Sektörler yüklenirken hata oluştu.</p>
              ) : null}
              <div className='grid grid-cols-4 gap-3'>
                {sectorItems.map((sector) => (
                  <Link
                    key={sector.id}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      activeSectorId === sector.id
                        ? 'border-primary/30 bg-[#EEF4FF] text-primary'
                        : 'border-slate-100 text-slate-700 hover:border-primary/30 hover:bg-[#EEF4FF] hover:text-primary'
                    }`}
                    href={`/sektorler/${sector.slug}`}
                    onMouseEnter={() => setActiveSectorId(sector.id)}
                  >
                    {sector.name}
                  </Link>
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
                      <Link
                        href={root.href}
                        className='text-sm font-semibold text-[#003FB1] hover:underline'
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {root.name}
                      </Link>
                      <div className='flex flex-wrap gap-1.5'>
                        {root.groups.slice(0, 4).map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className='rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:bg-[#EEF4FF] hover:text-primary'
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
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
                    <Link
                      key={sector.id}
                      href={`/sektorler/${sector.slug}`}
                      className='rounded-md bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {sector.name}
                    </Link>
                  ))}
                </div>
              ) : null}

              <Link
                className='block rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-[#EEF4FF] hover:text-primary'
                href={supplierApplyHref}
              >
                Satıcı Ol
              </Link>
              <Link
                className='block rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-[#EEF4FF] hover:text-primary'
                href='/lojistik'
              >
                Lojistik
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
