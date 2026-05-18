'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const storeNavItems = [
  { key: 'categories', label: 'Kategoriler' },
  { key: 'home', label: 'Anasayfa' },
  { key: 'about', label: 'Hakkımızda' },
  { key: 'contact', label: 'İletişim' },
] as const;

export type StoreProfileTab = (typeof storeNavItems)[number]['key'];

const storeCategoryMenu = [
  {
    id: 'packaging',
    icon: 'inventory_2',
    name: 'Ambalaj Malzemeleri',
    groups: [
      {
        title: 'Streç ve Sarf',
        items: ['Palet Streç Film', 'Koli Bandı', 'Balonlu Naylon', 'Kraft Kağıt'],
      },
      {
        title: 'Kutu ve Paket',
        items: ['Karton Koli', 'E-ticaret Kutusu', 'Köşe Koruyucu', 'Paket Dolgu'],
      },
    ],
  },
  {
    id: 'logistics',
    icon: 'local_shipping',
    name: 'Lojistik Ekipmanları',
    groups: [
      {
        title: 'Taşıma',
        items: ['Euro Palet', 'Plastik Palet', 'El Arabası', 'Transpalet'],
      },
      {
        title: 'Operasyon',
        items: ['Yük Sabitleme', 'Depo Etiketi', 'Sevkiyat Poşeti', 'Koruyucu Ekipman'],
      },
    ],
  },
  {
    id: 'warehouse',
    icon: 'warehouse',
    name: 'Depolama Çözümleri',
    groups: [
      {
        title: 'Depo Düzeni',
        items: ['Raf Sistemleri', 'İstif Kasaları', 'Depo Kutuları', 'Alan Etiketleri'],
      },
      {
        title: 'Kurumsal Hizmet',
        items: ['Stok Yönetimi', 'Sipariş Hazırlama', 'Sevkiyat Planlama', 'Paketleme Hizmeti'],
      },
    ],
  },
  {
    id: 'security',
    icon: 'verified',
    name: 'Güvenlik Mühürleri',
    groups: [
      {
        title: 'Mühürler',
        items: ['Plastik Güvenlik Mührü', 'Metal Mühür', 'Numaratörlü Mühür', 'Konteyner Mührü'],
      },
      {
        title: 'Takip',
        items: ['Barkod Etiketi', 'QR Etiket', 'Uyarı Etiketi', 'Kırılabilir Etiketi'],
      },
    ],
  },
] as const;

type StoreProfileNavProps = {
  activeTab: StoreProfileTab;
  onTabChange: (tab: StoreProfileTab) => void;
};

export function StoreProfileNav({ activeTab, onTabChange }: StoreProfileNavProps) {
  const router = useRouter();
  const navRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileMenuLevel, setMobileMenuLevel] = useState<'root' | 'categories' | 'groups' | 'items'>('root');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(storeCategoryMenu[0].id);
  const [mobileCategoryId, setMobileCategoryId] = useState<string>(storeCategoryMenu[0].id);
  const [mobileGroupTitle, setMobileGroupTitle] = useState<string>(storeCategoryMenu[0].groups[0].title);
  const [searchValue, setSearchValue] = useState('');

  const activeCategory =
    storeCategoryMenu.find((category) => category.id === activeCategoryId) ?? storeCategoryMenu[0];
  const mobileCategory =
    storeCategoryMenu.find((category) => category.id === mobileCategoryId) ?? storeCategoryMenu[0];
  const mobileGroup =
    mobileCategory.groups.find((group) => group.title === mobileGroupTitle) ?? mobileCategory.groups[0];

  useEffect(() => {
    const updateStickyState = () => {
      const nav = navRef.current;
      if (!nav) {
        return;
      }

      const headerOffset = 0;
      setIsStuck(nav.getBoundingClientRect().top <= headerOffset + 1);
    };

    updateStickyState();
    window.addEventListener('scroll', updateStickyState, { passive: true });
    window.addEventListener('resize', updateStickyState);

    return () => {
      window.removeEventListener('scroll', updateStickyState);
      window.removeEventListener('resize', updateStickyState);
    };
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedSearch = searchValue.trim();
    router.push(
      normalizedSearch.length > 0
        ? `/kesfet?search=${encodeURIComponent(normalizedSearch)}`
        : '/kesfet',
    );
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileMenuLevel('root');
  };

  const mobileMenuTitle =
    mobileMenuLevel === 'root'
      ? 'Menü'
      : mobileMenuLevel === 'categories'
        ? 'Kategoriler'
        : mobileMenuLevel === 'groups'
          ? mobileCategory.name
          : mobileGroup.title;

  return (
    <div
      className={[
        'sticky top-0 z-40 mb-3 ml-[calc(50%-50vw)] w-screen border-b border-surface-container-high px-4 py-2 transition-all duration-300 ease-out sm:px-8 md:mb-7 md:py-0',
        isStuck
          ? 'translate-y-0 bg-white/95 shadow-md backdrop-blur'
          : 'translate-y-0 bg-background shadow-sm',
      ].join(' ')}
      onMouseLeave={() => setIsCategoryMenuOpen(false)}
      ref={navRef}
    >
      <div className='mx-auto flex max-w-7xl items-center gap-4'>
        <div className='flex min-w-0 flex-1 items-center gap-2 md:hidden'>
          <button
            aria-label='Mağaza menüsü'
            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary'
            onClick={() => {
              setMobileMenuLevel('root');
              setIsMobileMenuOpen(true);
            }}
            type='button'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>menu</span>
          </button>

          <form
            className='relative flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 transition-colors focus-within:border-primary/30 focus-within:bg-white'
            onSubmit={handleSearchSubmit}
          >
            <span className='material-symbols-outlined text-[20px] text-outline'>search</span>
            <input
              aria-label='Mağazada ara'
              className='min-w-0 flex-1 border-none bg-transparent text-sm text-on-surface-variant outline-none placeholder:text-slate-400 focus:ring-0'
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder='Mağazada ara...'
              type='search'
              value={searchValue}
            />
          </form>
        </div>

        <div className='hidden min-w-0 flex-1 overflow-visible md:flex'>
          {storeNavItems.map((item) => {
            const isCategoryButton = item.key === 'categories';
            const isActive = !isCategoryButton && item.key === activeTab;
            const isCategoryHighlighted = isCategoryButton && isCategoryMenuOpen;

            return (
              <button
                className={[
                  'flex h-14 min-w-0 items-center justify-center gap-1 px-1 text-xs font-semibold transition-colors sm:text-sm md:h-auto md:shrink-0 md:px-6 md:py-4',
                  isActive
                    ? 'border-b-2 border-primary bg-surface-container-low/50 text-primary'
                    : isCategoryHighlighted
                      ? 'border-b-2 border-transparent bg-surface-container-low/50 text-primary'
                      : 'border-b-2 border-transparent text-on-surface-variant hover:bg-surface-container-low/50 hover:text-primary',
                ].join(' ')}
                key={item.label}
                onClick={() => {
                  if (isCategoryButton) {
                    setIsCategoryMenuOpen((prev) => !prev);
                    return;
                  }

                  onTabChange(item.key);
                  setIsCategoryMenuOpen(false);
                }}
                onMouseEnter={() => {
                  if (isCategoryButton) {
                    setIsCategoryMenuOpen(true);
                    return;
                  }

                  setIsCategoryMenuOpen(false);
                }}
                type='button'
              >
                {isCategoryButton ? (
                  <>
                    <span className='material-symbols-outlined text-[22px] leading-none md:text-[18px]'>menu</span>
                    <span className='hidden md:inline'>{item.label}</span>
                  </>
                ) : (
                  <span className='truncate'>{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        <form
          className='relative hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 transition-colors focus-within:border-primary/30 focus-within:bg-white lg:flex'
          onSubmit={handleSearchSubmit}
        >
          <span className='material-symbols-outlined text-[20px] text-outline'>search</span>
          <input
            aria-label='Mağazada ara'
            className='min-w-0 flex-1 border-none bg-transparent text-sm text-on-surface-variant outline-none placeholder:text-slate-400 focus:ring-0'
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder='Mağazada ürün ara...'
            type='search'
            value={searchValue}
          />
        </form>
      </div>

      {isCategoryMenuOpen ? (
        <div className='absolute left-0 right-0 top-full z-50 border-t border-slate-200 bg-white shadow-xl'>
          <div className='mx-auto max-h-[calc(100dvh-4rem)] w-full overflow-y-auto border-b border-slate-200 bg-white md:hidden'>
            <div className='grid grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]'>
              <aside className='border-r border-slate-200 bg-slate-50'>
                <ul className='py-1'>
                  {storeCategoryMenu.map((category) => {
                    const active = category.id === mobileCategoryId;

                    return (
                      <li key={category.id}>
                        <button
                          className={[
                            'flex min-h-14 w-full items-center gap-2 px-3 py-3 text-left text-xs font-semibold transition-colors',
                            active
                              ? 'bg-[#EEF4FF] text-primary'
                              : 'text-slate-700 hover:bg-[#EEF4FF] hover:text-primary',
                          ].join(' ')}
                          onClick={() => {
                            setMobileCategoryId(category.id);
                            setActiveCategoryId(category.id);
                          }}
                          type='button'
                        >
                          <span className='material-symbols-outlined shrink-0 text-[20px]'>{category.icon}</span>
                          <span className='min-w-0 leading-snug'>{category.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <section className='min-w-0 bg-white p-4'>
                {(() => {
                  const mobileCategory =
                    storeCategoryMenu.find((category) => category.id === mobileCategoryId) ?? storeCategoryMenu[0];

                  return (
                    <div className='space-y-4'>
                      {mobileCategory.groups.map((group) => (
                        <div className='space-y-2' key={group.title}>
                          <h4 className='text-xs font-bold text-on-surface'>{group.title}</h4>
                          <div className='grid gap-1'>
                            {group.items.map((item) => (
                              <button
                                className='flex items-center justify-between rounded-lg px-2 py-2 text-left text-xs leading-5 text-slate-600 transition-colors hover:bg-[#EEF4FF] hover:text-primary'
                                key={item}
                                onClick={() => {
                                  setIsCategoryMenuOpen(false);
                                }}
                                type='button'
                              >
                                <span>{item}</span>
                                <span className='material-symbols-outlined text-[15px]'>chevron_right</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>
            </div>
          </div>

          <div className='mx-auto hidden max-w-7xl overflow-hidden rounded-b-xl border-x border-b border-slate-200 bg-white md:flex'>
            <aside className='w-72 shrink-0 border-r border-slate-200 bg-slate-50'>
              <ul className='py-2'>
                {storeCategoryMenu.map((category) => {
                  const active = category.id === activeCategory.id;

                  return (
                    <li key={category.id}>
                      <button
                        className={[
                          'flex h-14 w-full items-center justify-between px-5 text-left text-sm font-medium transition-colors',
                          active
                            ? 'bg-[#EEF4FF] text-primary'
                            : 'text-slate-700 hover:bg-[#EEF4FF] hover:text-primary',
                        ].join(' ')}
                        onMouseEnter={() => setActiveCategoryId(category.id)}
                        type='button'
                      >
                        <span className='flex items-center gap-3'>
                          <span className='material-symbols-outlined text-[21px]'>{category.icon}</span>
                          {category.name}
                        </span>
                        <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <section className='min-h-[300px] flex-1 bg-white p-6'>
              <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
                {activeCategory.groups.map((group) => (
                  <div className='space-y-3' key={group.title}>
                    <h4 className='text-sm font-bold text-on-surface'>{group.title}</h4>
                    <div className='grid gap-2'>
                      {group.items.map((item) => (
                        <button
                          className='flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-[#EEF4FF] hover:text-primary'
                          key={item}
                          onClick={() => {
                            setIsCategoryMenuOpen(false);
                          }}
                          type='button'
                        >
                          {item}
                          <span className='material-symbols-outlined text-[16px]'>chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {isMobileMenuOpen ? (
        <>
          <button
            aria-label='Menüyü kapat'
            className='fixed inset-0 z-[80] bg-black/25 md:hidden'
            onClick={closeMobileMenu}
            type='button'
          />

          <div className='fixed left-0 top-0 z-[90] flex h-dvh w-[50vw] min-w-[190px] max-w-[240px] flex-col border-r border-slate-200 bg-white shadow-2xl md:hidden'>
            <div className='flex h-14 items-center gap-2 border-b border-slate-200 px-3'>
              <button
                aria-label='Geri'
                className='flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100'
                onClick={() => {
                  if (mobileMenuLevel === 'items') {
                    setMobileMenuLevel('groups');
                    return;
                  }

                  if (mobileMenuLevel === 'groups') {
                    setMobileMenuLevel('categories');
                    return;
                  }

                  if (mobileMenuLevel === 'categories') {
                    setMobileMenuLevel('root');
                    return;
                  }

                  closeMobileMenu();
                }}
                type='button'
              >
                <span className='material-symbols-outlined text-[22px]'>
                  {mobileMenuLevel === 'root' ? 'close' : 'arrow_back'}
                </span>
              </button>
              <h2 className='truncate text-sm font-medium text-on-surface'>{mobileMenuTitle}</h2>
            </div>

            <div className='flex-1 overflow-y-auto'>
              {mobileMenuLevel === 'root' ? (
                <ul>
                  <li>
                    <button
                      className='flex min-h-11 w-full items-center justify-between border-b border-slate-200 px-3 text-left text-xs font-normal text-slate-800 transition-colors hover:bg-slate-50'
                      onClick={() => setMobileMenuLevel('categories')}
                      type='button'
                    >
                      <span>Kategoriler</span>
                      <span className='material-symbols-outlined text-[19px]'>chevron_right</span>
                    </button>
                  </li>
                  {storeNavItems.filter((item) => item.key !== 'categories').map((item) => (
                    <li key={item.key}>
                      <button
                        className='flex min-h-11 w-full items-center border-b border-slate-200 px-3 text-left text-xs font-normal text-slate-800 transition-colors hover:bg-slate-50'
                        onClick={() => {
                          onTabChange(item.key);
                          closeMobileMenu();
                        }}
                        type='button'
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {mobileMenuLevel === 'categories' ? (
                <ul>
                  {storeCategoryMenu.map((category) => (
                    <li key={category.id}>
                      <button
                        className='flex min-h-11 w-full items-center justify-between border-b border-slate-200 px-3 text-left text-xs font-normal text-slate-800 transition-colors hover:bg-slate-50'
                        onClick={() => {
                          setMobileCategoryId(category.id);
                          setActiveCategoryId(category.id);
                          setMobileGroupTitle(category.groups[0].title);
                          setMobileMenuLevel('groups');
                        }}
                        type='button'
                      >
                        <span className='min-w-0 truncate pr-2'>{category.name}</span>
                        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50'>
                          <span className='material-symbols-outlined text-[17px]'>chevron_right</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {mobileMenuLevel === 'groups' ? (
                <ul>
                  {mobileCategory.groups.map((group) => (
                    <li key={group.title}>
                      <button
                        className='flex min-h-11 w-full items-center justify-between border-b border-slate-200 px-3 text-left text-xs font-normal text-slate-800 transition-colors hover:bg-slate-50'
                        onClick={() => {
                          setMobileGroupTitle(group.title);
                          setMobileMenuLevel('items');
                        }}
                        type='button'
                      >
                        <span className='min-w-0 truncate pr-2'>{group.title}</span>
                        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50'>
                          <span className='material-symbols-outlined text-[17px]'>chevron_right</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {mobileMenuLevel === 'items' ? (
                <ul>
                  {mobileGroup.items.map((item) => (
                    <li key={item}>
                      <button
                        className='flex min-h-10 w-full items-center border-b border-slate-200 px-3 text-left text-xs font-normal text-slate-800 transition-colors hover:bg-slate-50'
                        onClick={closeMobileMenu}
                        type='button'
                      >
                        <span className='truncate'>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
