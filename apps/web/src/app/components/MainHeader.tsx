"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { requestJson } from '@/lib/api';
import { hasAccessToken } from '@/lib/auth-token';
import { fetchCart } from '@/features/cart/api/cart.api';
import { fetchConversations } from '@/features/chat/api/chat.api';
import { useChatStore } from '@/features/chat/store/useChatStore';
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
  const pathname = usePathname();
  const [desktopMenu, setDesktopMenu] = useState<'categories' | 'sectors' | null>(null);
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileSectorOpen, setMobileSectorOpen] = useState(false);
  const [mobileSelectedCategoryId, setMobileSelectedCategoryId] = useState<string | null>(null);
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<string | null>(null);
  const totalItems = useCartStore((state) => state.totalItems);
  const setTotalItems = useCartStore((state) => state.setTotalItems);
  const toast = useCartStore((state) => state.toast);
  const clearToast = useCartStore((state) => state.clearToast);
  const setConversations = useChatStore((state) => state.setConversations);
  const conversationMap = useChatStore((state) => state.conversations);

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

  const conversationsQuery = useQuery({
    queryKey: ['nav', 'conversations', 'unread'],
    queryFn: () => fetchConversations({ filter: 'all' }),
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
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data);
    }
  }, [conversationsQuery.data, setConversations]);

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

  const supplierApplyHref = '/satici-ol';
  const supplierDiscoveryHref = '/uretici-toptancilar';
  const logisticsApplyHref = '/lojistik/basvuru';

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
  const totalUnreadMessages = Array.from(conversationMap.values()).reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );
  const isHomeActive = pathname === '/';
  const isCategoriesActive = pathname.startsWith('/kategori') || pathname.startsWith('/kategoriler');
  const isMessagesActive = pathname.startsWith('/messages');
  const isCartActive = pathname.startsWith('/sepet');
  const isProfileActive =
    pathname.startsWith('/kullanici-bilgilerim') ||
    pathname.startsWith('/adres-bilgilerim') ||
    pathname.startsWith('/kayitli-kartlarim') ||
    pathname.startsWith('/duyuru-tercihlerim') ||
    pathname.startsWith('/sifre-degisikligi') ||
    pathname.startsWith('/siparislerim') ||
    pathname.startsWith('/favorilerim');
  const profileHref = hasAccessToken()
    ? '/kullanici-bilgilerim'
    : '/login?next=/kullanici-bilgilerim';
  const messagesHref = hasAccessToken()
    ? '/messages'
    : '/login?next=/messages';
  const mobileNavItemClass = (isActive: boolean) =>
    `group flex h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-center transition-all duration-200 active:scale-95 ${
      isActive ? '-translate-y-0.5 bg-slate-100/55 text-slate-950 shadow-sm' : 'text-slate-600 active:bg-slate-100'
    }`;
  const mobileNavIconClass = (isActive: boolean) =>
    `material-symbols-outlined flex h-7 w-7 items-center justify-center text-[24px] leading-none ${
      isActive
        ? 'text-slate-950 [font-variation-settings:"FILL"_1]'
        : 'text-slate-500 [font-variation-settings:"FILL"_0]'
    }`;
  const mobileNavLabelClass = (isActive: boolean) =>
    `flex h-3 items-center justify-center truncate text-[9px] leading-none transition-colors ${
      isActive ? 'font-semibold text-slate-950' : 'font-medium text-slate-600'
    }`;
  const formatLabel = (value?: string | null) => {
    if (!value) return '';

    const lower = value.toLocaleLowerCase('tr-TR');
    return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
  };

  return (
    <header
      className={`z-50 bg-white lg:sticky lg:top-0 lg:border-b lg:border-slate-100 lg:shadow-sm ${
        isHomeActive ? 'sticky top-0 border-b border-slate-100 shadow-sm' : ''
      }`}
    >
      <nav
        className={`relative mx-auto w-full max-w-[1920px] items-center justify-between px-6 py-3 ${
          isHomeActive ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <button
          aria-label='Menü'
          className='mr-3 flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95 lg:hidden'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          type='button'
        >
          <span className='material-symbols-outlined text-[22px] leading-none'>menu</span>
        </button>

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

        <div className='flex items-center gap-5'>
          <Link
            aria-label='Mesajlar'
            className='hidden items-center gap-1.5 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95 sm:flex'
            href={messagesHref}
          >
            <span className='material-symbols-outlined text-[25px] leading-none'>forum</span>
            <span className='text-[14px] font-medium'>Mesajlar</span>
          </Link>

          <div className='relative'>
            <Link
              aria-label='Sepetim'
              className='relative hidden items-center gap-1.5 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95 sm:flex'
              href='/sepet'
            >
              <span className='relative inline-flex items-center justify-center'>
                <span className='material-symbols-outlined text-[25px] leading-none'>shopping_cart</span>
                {totalItems > 0 ? (
                  <span className='absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-[#1A56DB] px-1 text-center text-[10px] font-semibold leading-none text-white shadow-sm'>
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                ) : null}
              </span>
              <span className='text-[14px] font-medium'>Sepetim</span>
            </Link>

            {toast ? (
              <div className='absolute right-0 top-[calc(100%+10px)] w-[220px] rounded-xl border border-[#D7E4FF] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg'>
                {toast.message}
              </div>
            ) : null}
          </div>

          <div className='hidden sm:block'>
            <AccountNavLink />
          </div>
        </div>
      </nav>

      <div className='relative hidden border-b border-slate-200/50 bg-slate-50 lg:block'>
        <div
          className='mx-auto flex min-h-10 max-w-[1920px] items-center justify-between px-6'
          onMouseLeave={() => setDesktopMenu(null)}
        >
          <div className='hidden items-center gap-8 lg:flex'>
            <button
              className='flex items-center gap-2 py-2 text-[13px] font-medium text-on-surface transition-colors hover:text-primary'
              onMouseEnter={() => setDesktopMenu('categories')}
              type='button'
            >
              <span className='material-symbols-outlined text-[18px] leading-none'>menu</span>
              Kategoriler
            </button>

            <button
              className='py-2 text-[13px] font-medium text-on-surface-variant transition-colors hover:text-primary'
              onMouseEnter={() => setDesktopMenu('sectors')}
              type='button'
            >
              Sektörler
            </button>

            <Link
              className='py-2 text-[13px] font-medium text-on-surface-variant transition-colors hover:text-primary'
              href={supplierDiscoveryHref}
            >
              Üretici & Toptancılar
            </Link>
            <Link
              className='py-2 text-[13px] font-medium text-on-surface-variant transition-colors hover:text-primary'
              href='/lojistik'
            >
              Lojistik Partnerler
            </Link>
          </div>

          <div className='hidden items-center gap-4 lg:flex'>
            <Link className='text-[10px] font-medium text-on-surface-variant transition-colors hover:text-primary' href={supplierApplyHref}>
              ToptanNext&#39;te Satış Yap
            </Link>
            <Link className='text-[10px] font-medium text-on-surface-variant transition-colors hover:text-primary' href={logisticsApplyHref}>
              Lojistik Partnerimiz Ol
            </Link>
            <a className='text-[10px] font-medium text-on-surface-variant transition-colors hover:text-primary' href='#'>
              Mobil Uygulama
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
              {isSectorsError ? <p className='text-sm text-red-600'>Sektörler yüklenirken hata oluştu.</p> : null}
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
      </div>

      {mobileMenuOpen ? (
        <>
          <button
            aria-label='Menüyü kapat'
            className='fixed inset-0 z-[80] bg-black/20 lg:hidden'
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileSelectedCategoryId(null);
              setMobileSelectedGroupId(null);
            }}
            type='button'
          />

          <div className='fixed inset-y-0 left-0 z-[90] flex h-full w-[60vw] max-w-[60vw] flex-col border-r border-slate-200 bg-white shadow-2xl lg:hidden'>
            <div className='flex items-center gap-3 border-b px-4 py-3'>
              <button
                aria-label='Geri'
                className='flex h-9 w-9 items-center justify-center rounded-full text-slate-700'
                onClick={() => {
                  if (mobileSelectedGroupId) {
                    setMobileSelectedGroupId(null);
                    return;
                  }

                  if (mobileSelectedCategoryId) {
                    setMobileSelectedCategoryId(null);
                    return;
                  }

                  setMobileMenuOpen(false);
                }}
                type='button'
              >
                <span className='material-symbols-outlined text-[20px]'>arrow_back</span>
              </button>
              <h2 className='text-base font-semibold'>
                {mobileSelectedCategoryId
                  ? formatLabel(categoryMenuData.find((c) => c.id === mobileSelectedCategoryId)?.name)
                  : 'Kategoriler'}
              </h2>
            </div>

            <div className='flex-1 overflow-y-auto'>
              {!mobileSelectedCategoryId ? (
                <ul>
                  {categoryMenuData.map((root) => (
                    <li key={root.id}>
                      <div className='flex items-center justify-between border-b px-4 py-3'>
                        <Link
                          href={root.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className='text-sm font-medium text-slate-800'
                        >
                          {formatLabel(root.name)}
                        </Link>

                        <button
                          className='flex h-7 w-7 items-center justify-center rounded-md bg-slate-50'
                          onClick={() => {
                            setMobileSelectedCategoryId(root.id);
                            setMobileSelectedGroupId(null);
                          }}
                          type='button'
                          aria-label={`Alt kategoriler - ${root.name}`}
                        >
                          <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : !mobileSelectedGroupId ? (
                // Show groups styled like the main category list (black text, same layout)
                <ul>
                  {categoryMenuData.find((c) => c.id === mobileSelectedCategoryId)?.groups.map((group) => (
                    <li key={group.id}>
                      <div className='flex items-center justify-between border-b px-4 py-3'>
                        <Link
                          href={group.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className='text-sm font-medium text-slate-800'
                        >
                          {formatLabel(group.title)}
                        </Link>

                        {group.items && group.items.length > 0 ? (
                          <button
                            className='flex h-7 w-7 items-center justify-center rounded-md bg-slate-50'
                            onClick={() => setMobileSelectedGroupId(group.id)}
                            type='button'
                            aria-label={`Alt kategori öğeleri - ${group.title}`}
                          >
                            <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                // Show individual items of the selected group, same styling as main category list
                <ul>
                  {categoryMenuData
                    .find((c) => c.id === mobileSelectedCategoryId)
                    ?.groups.find((g) => g.id === mobileSelectedGroupId)
                    ?.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className='block border-b px-4 py-3 text-sm font-medium text-slate-800'
                        >
                          {formatLabel(item.name)}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}

      <nav
        aria-label='Mobil alt navigasyon'
        className='fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/85 px-2 pb-[calc(env(safe-area-inset-bottom)+0.15rem)] pt-1 shadow-[0_-8px_22px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden'
      >
        <div className='mx-auto grid max-w-md grid-cols-5 items-center gap-1'>
          <Link className={mobileNavItemClass(isHomeActive)} href='/'>
            <span className={mobileNavIconClass(isHomeActive)}>home</span>
            <span className={mobileNavLabelClass(isHomeActive)}>Anasayfa</span>
          </Link>

          <Link className={mobileNavItemClass(isCategoriesActive)} href='/kategoriler'>
            <span className={mobileNavIconClass(isCategoriesActive)}>category</span>
            <span className={mobileNavLabelClass(isCategoriesActive)}>Kategoriler</span>
          </Link>

          <Link className={mobileNavItemClass(isMessagesActive)} href={messagesHref}>
            <span className='relative inline-flex'>
              <span className={mobileNavIconClass(isMessagesActive)}>forum</span>
              {totalUnreadMessages > 0 ? (
                <span className='absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#FF5A1F] px-1 text-[9px] font-black leading-none text-white'>
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              ) : null}
            </span>
            <span className={mobileNavLabelClass(isMessagesActive)}>Mesajlarım</span>
          </Link>

          <Link className={`${mobileNavItemClass(isCartActive)} relative`} href='/sepet'>
            <span className='relative inline-flex'>
              <span className={mobileNavIconClass(isCartActive)}>shopping_cart</span>
              {totalItems > 0 ? (
                <span className='absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#FF5A1F] px-1 text-[9px] font-black leading-none text-white'>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              ) : null}
            </span>
            <span className={mobileNavLabelClass(isCartActive)}>Sepetim</span>
          </Link>

          <Link className={mobileNavItemClass(isProfileActive)} href={profileHref}>
            <span className={mobileNavIconClass(isProfileActive)}>account_circle</span>
            <span className={mobileNavLabelClass(isProfileActive)}>Hesabım</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
