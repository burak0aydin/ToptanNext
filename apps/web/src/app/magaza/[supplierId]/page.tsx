'use client';

import { useEffect, useState } from 'react';
import { MainHeader } from '@/app/components/MainHeader';
import { MainFooter } from '@/app/components/MainFooter';
import { StoreProfileNav, type StoreProfileTab } from './StoreProfileNav';

const showcaseImages = {
  banner:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBVpqU_XrbjzjLGQipZyxCE_N8EZNknmP7HkBXgqT6Vl1yq0jwgljVSIhhToxSo0h1FKKzoHN8iaXBZSaJbevrvDcpsVQjrYlrSWJ83eZJc9H-E95TB7q7368wxhASH7Vm3ExKWKqKwLfq_hIjyleTAgp5nWD2j2wT6c6A2MJbcHLq7nIKhAQEgJ03k08NQ_w5UGoFaBxUAgcYCQkGkR2BJ9wf-TDJHhe1dy4K4OiRsuHSKY_PeZQKPxKO50WgjIpIdvX3w9vGDpn8',
  logo:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAdZMTt1YjI4yXsl4SGmhQZqrhnD-7ou9HGJfx7EXpjc_SpeZxVJxdGSsC6zYxXtWxYvN1jBwjkcjedD_GMKNPfNCAe3Oj19sGgefAGAgwWLn_UAbNri5eJ08dx9AzztPaHK3OvQmBnS9XTR28dSkyZAIG7v__qIOu_yl7Z_Ir5hbTD6Ue5FkYX8xvtLMcmXyZRM8ByM4wTZkUgZ9Lp2rifsYVG9ylNrRVMvPhlQhjF17ouRYJzA-rKV5QML97MgPGtSzTMvpB-6kM',
  office:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBzobwZuB0Uf7Dz2UZ08KxOU7fRoeErWC38oqHtALw-I0rateEmmz12uSGQ2XBg2byPQmdSjBHMwIdK0PQebOieODoK22mvrWNhvLCncpo-aXCisGrnQB1iZQFs9b0X5-Pf0TexCCgnOk1xsovwMWTYVy28FoOvAtsPGPKxA-6blbg_oFMB1-j8jvz6pwsw3eSGeKkJexOKLoumHCPvgWsc8xqEgAdf7O6QulSWJAnqvCtkQzCQKezJSSYqBzd2dwGZCJzil-M__sM',
  warehouse:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBhGEnZA6AyzPZkgl70bcTyZw45K7c5izGMsGnaWxa3nMhEmnSSrbLf9fLOtlPFv0yO3BfPPz7kvAwzFq_AlTcJhJDawHO5XkzGloHbZMvh-6wnHzTR6mVYMBUDd_9iMzSqWoGen7-kEUyLVz2dDCWBLddzMi5f_A-56Ene2lFR8spHguoyT9xDhduGgTAG-iEnoLk90GRVD89ZeZxAtfJJo56Or27-fVUP_dp0VJwEfg2_OVCUvNug0wQfeGDaQ49rqswCfigLej4',
  stretch:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB8k-64EhDeMZacwlR5hL3ydZ9UnmKqNdCuTTbkWN14g-M0UJXjKq1Ux2-8C9Ebs9y9O6iT1HNDrMh5elQbPJKRG907R5kHSlNFjfsAhIej_8orkpZohA3feIVBAsxp7IVtoQSbGvPB6fxYs6jz32-LUYekRQLtE0G0zaV8kLGrbQih6zSKJygsBFEgMx1PzwvvbRRKJ0XV1fpdlcoIsCeCSvFt5nSXNXPk8S4rt9WYHweU4j8TpMSqh1DcQge7d0dHg977I8IXXMI',
  tape:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB3I104zSRZ2uvlSzTdgDVMQoFxdwCz1-qxLpsj1qyRtCOq6_vDrr0pJmAStZwOCNdEolcwdu3cAHsfBAJh8sV9RedNxw2X08GkXmgkhRK53BIWtKCpwQDuqFtWBX0Xy3JBx4-t7L69Y7ioK5Giuqr2kK739mRCwL0MzeFRlTVHsa_UEEpjKETiTDOt0wwptBVxl6BukRQChRQSaPxUfy_4b_tlXx32XKmUtEkC-5WKmRQnJ-45hgs5pm4rEUiJ51o0RigMkLgqaGs',
  pallet:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCkFICcGlpM2LQkOOnEl-8WX5iGYCqwW9JBWh7tVpb6dVfXmYP2oDZ9taOeoDut9Fz41b0RaBj-RO9F1I7QiD-JfJP54gFnRzMgtCPJb0bNAETOaguPWUD4v0gOcwtqwLSRMJPISIyrTLfpe0rLOSI-DdHx_LcCmRDfEm3PNpGxc80p5KGKuGKRS_pOoYqg8bmZvZl9PoZkg8gHN2p_qO0uiFPIYILzuI-R3QTpFKRTQZHAwKow7yJ-eR2-7ssTtBG-PetGV7dzCwY',
};

const products = [
  {
    badge: 'Popüler',
    category: 'Ambalaj',
    image: showcaseImages.stretch,
    minOrder: '100 Rulo',
    name: 'Endüstriyel Palet Streç Film 17 Mikron',
    price: '₺45.00 - ₺52.00',
  },
  {
    category: 'Ambalaj',
    image: showcaseImages.tape,
    minOrder: '500 Adet',
    name: 'Şeffaf Koli Bandı 45x100m Akrilik',
    price: '₺12.50 - ₺15.00',
  },
  {
    category: 'Lojistik Ekipmanları',
    image: showcaseImages.pallet,
    minOrder: '50 Adet',
    name: 'Standart Euro Palet 80x120 İkinci El',
    price: '₺180.00 - ₺220.00',
  },
];

const storeCategories = [
  { icon: 'inventory_2', image: showcaseImages.stretch, label: 'Ambalaj' },
  { icon: 'sell', image: showcaseImages.tape, label: 'Koli Bandı' },
  { icon: 'pallet', image: showcaseImages.pallet, label: 'Palet' },
  { icon: 'local_shipping', image: showcaseImages.warehouse, label: 'Lojistik' },
  { icon: 'warehouse', image: showcaseImages.office, label: 'Depolama' },
  { icon: 'verified', image: showcaseImages.logo, label: 'Mühürler' },
];

const homeSlides = [
  {
    image: showcaseImages.warehouse,
    title: 'Endüstriyel lojistik çözümleri',
    text: 'Depolama, ambalaj ve sevkiyat ihtiyaçlarınız için kurumsal tedarik.',
  },
  {
    image: showcaseImages.stretch,
    title: 'Toplu alım avantajları',
    text: 'Palet streç, koli bandı ve ekipmanlarda işletmelere özel fiyatlar.',
  },
];

const bestSellers = [
  { ...products[1], badge: 'Çok Satan', sales: '1.240 sipariş' },
  { ...products[0], badge: 'Favori', sales: '980 sipariş' },
  { ...products[2], badge: 'Hızlı Teslim', sales: '740 sipariş' },
];

const contactCards = [
  {
    icon: 'business',
    title: 'Merkez Ofis',
    text: 'OSB Mah. 4. Cadde No:12',
    subtext: 'Başakşehir, İstanbul',
  },
  {
    icon: 'call',
    title: 'Telefon',
    text: '+90 212 555 01 23',
  },
  {
    icon: 'mail',
    title: 'E-posta',
    text: 'b2b@globallojistik.com.tr',
  },
  {
    icon: 'schedule',
    title: 'Çalışma Saatleri',
    text: 'Pzt - Cmt: 09:00 - 18:30',
  },
];

export default function StoreProfilePage() {
  const [activeTab, setActiveTab] = useState<StoreProfileTab>('home');
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);

  const showHome = activeTab === 'home';
  const showAbout = activeTab === 'about';
  const showProducts = activeTab === 'categories';
  const showContact = activeTab === 'contact';
  const activeMobileSlide = homeSlides[mobileSlideIndex % homeSlides.length];

  useEffect(() => {
    if (!showHome) {
      return;
    }

    const interval = window.setInterval(() => {
      setMobileSlideIndex((current) => (current + 1) % homeSlides.length);
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [showHome]);

  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface'>
      <MainHeader />

      <main className='flex-1'>
        <div className='h-40 w-full overflow-hidden bg-surface-container-high sm:h-64 md:h-80'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt='Warehouse Banner' className='h-full w-full object-cover opacity-80' src={showcaseImages.banner} />
        </div>

        <div className='relative z-10 mx-auto -mt-16 mb-12 max-w-7xl px-4 sm:-mt-24 sm:px-8'>
          <div className='flex flex-col items-start justify-between rounded-xl border border-surface-container-low bg-surface-container-lowest p-5 shadow-lg md:flex-row md:items-center md:p-8'>
            <div className='flex w-full flex-wrap items-start gap-3 sm:gap-6 md:w-auto md:flex-nowrap md:items-center'>
              <div className='flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/10 bg-white sm:h-32 sm:w-32'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt='Supplier Logo' className='h-full w-full object-contain p-2' src={showcaseImages.logo} />
              </div>

              <div className='min-w-0 flex-1'>
                <div className='mb-2 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3'>
                  <h1 className='max-w-full truncate text-base font-bold leading-tight text-on-surface sm:text-2xl md:text-4xl'>Global Lojistik A.Ş.</h1>
                  <span className='flex items-center gap-1 rounded bg-primary-container px-2 py-1 text-[10px] font-semibold uppercase text-on-primary-container sm:text-xs'>
                    <span className='material-symbols-outlined text-[14px] sm:text-[16px]'>verified</span> Onaylı Tedarikçi
                  </span>
                </div>
                <p className='mb-4 flex items-center gap-1.5 text-xs font-medium text-on-surface-variant sm:gap-2 sm:text-sm'>
                  <span className='material-symbols-outlined text-[16px] sm:text-[18px]'>location_on</span> İstanbul, Türkiye
                </p>

                <div className='hidden gap-4 md:flex'>
                  <button className='flex h-11 min-w-40 items-center justify-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container px-6 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high' type='button'>
                    <span className='material-symbols-outlined text-[18px]'>add</span> Takip Et
                  </button>
                  <button className='flex h-11 min-w-40 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90' type='button'>
                    <span className='material-symbols-outlined text-[24px]'>chat</span> Sohbet Et
                  </button>
                </div>
              </div>

              <div className='flex w-full gap-2 md:hidden'>
                <button className='flex h-10 flex-1 basis-0 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container px-2 text-xs font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high sm:h-11 sm:min-w-40 sm:flex-none sm:gap-2 sm:px-6 sm:text-sm' type='button'>
                  <span className='material-symbols-outlined text-[18px]'>add</span> Takip Et
                </button>
                <button className='flex h-10 flex-1 basis-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary/90 sm:h-11 sm:min-w-40 sm:flex-none sm:gap-2 sm:px-6 sm:text-sm' type='button'>
                  <span className='material-symbols-outlined text-[18px] sm:text-[24px]'>chat</span> Sohbet Et
                </button>
              </div>
            </div>

            <div className='mt-6 flex w-full justify-between gap-3 md:mt-0 md:w-auto md:gap-8'>
              {[
                ['4.8', 'Mağaza Puanı'],
                ['12 Yıl', 'Platformda'],
                ['%98', 'Yanıt Oranı'],
              ].map(([value, label]) => (
                <div className='text-center' key={label}>
                  <p className='text-lg font-bold text-on-surface sm:text-xl'>{value}</p>
                  <p className='text-[10px] font-semibold uppercase text-on-surface-variant sm:text-xs'>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <StoreProfileNav activeTab={activeTab} onTabChange={setActiveTab} />

          <div className='grid grid-cols-1 gap-8 lg:grid-cols-5'>
            <div className='space-y-16 lg:col-span-4'>
              {showHome ? (
              <section className='space-y-12'>
                <div className='md:hidden'>
                  <div className='group relative h-56 overflow-hidden rounded-xl bg-slate-900 shadow-sm'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={activeMobileSlide.title} className='h-full w-full object-cover opacity-70 transition-opacity duration-500' src={activeMobileSlide.image} />
                    <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent' />
                    <div className='absolute bottom-0 left-0 right-0 p-5 text-white'>
                      <h2 className='text-lg font-bold'>{activeMobileSlide.title}</h2>
                      <p className='mt-2 text-sm leading-6 text-white/85'>{activeMobileSlide.text}</p>
                    </div>
                    <div className='absolute bottom-3 right-4 flex gap-1.5'>
                      {homeSlides.map((slide, index) => (
                        <button
                          aria-label={`${slide.title} slaytını göster`}
                          className={[
                            'h-1.5 rounded-full transition-all',
                            index === mobileSlideIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                          ].join(' ')}
                          key={slide.title}
                          onClick={() => setMobileSlideIndex(index)}
                          type='button'
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className='hidden grid-cols-1 gap-5 md:grid md:grid-cols-2'>
                  {homeSlides.map((slide) => (
                    <div className='group relative h-64 overflow-hidden rounded-xl bg-slate-900 shadow-sm' key={slide.title}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={slide.title} className='h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105' src={slide.image} />
                      <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent' />
                      <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
                        <h2 className='text-xl font-bold'>{slide.title}</h2>
                        <p className='mt-2 text-sm leading-6 text-white/85'>{slide.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='overflow-hidden rounded-xl border border-surface-container-low bg-white py-5 shadow-sm'>
                  <div className='store-category-marquee flex w-max gap-7 px-6'>
                    {Array.from({ length: 6 }, () => storeCategories).flat().map((category, index) => (
                      <button className='group flex w-24 shrink-0 flex-col items-center gap-3 text-center' key={`${category.label}-${index}`} type='button'>
                        <span className='flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-surface-container-low shadow-sm transition-all group-hover:scale-110 group-hover:border-primary'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={category.label} className='h-full w-full object-cover' src={category.image} />
                        </span>
                        <span className='text-xs font-semibold text-on-surface-variant group-hover:text-primary'>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className='mb-4 flex items-center justify-between gap-3 md:mb-6 md:gap-4'>
                    <h2 className='text-lg font-semibold md:text-2xl'>Öne Çıkan Ürünler</h2>
                    <button className='flex items-center gap-1 text-xs text-primary hover:underline md:text-sm' type='button'>
                      Tümünü Gör <span className='material-symbols-outlined text-[16px]'>arrow_forward</span>
                    </button>
                  </div>
                  <div className='grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3'>
                    {products.map((product) => (
                      <div className='group overflow-hidden rounded-xl border border-surface-container-low bg-surface-container-lowest transition-all duration-300 hover:border-primary/30 hover:shadow-md' key={product.name}>
                        <div className='relative h-28 bg-surface-container md:h-48'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={product.name} className='h-full w-full object-cover' src={product.image} />
                          {product.badge ? (
                            <div className='absolute left-2 top-2 rounded bg-secondary-container px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-secondary-container md:px-2 md:py-1 md:text-xs'>
                              {product.badge}
                            </div>
                          ) : null}
                        </div>
                        <div className='p-3 md:p-5'>
                          <p className='mb-1 text-[10px] font-semibold uppercase text-outline md:text-xs'>{product.category}</p>
                          <h3 className='mb-2 line-clamp-2 text-xs font-semibold transition-colors group-hover:text-primary md:mb-3 md:text-lg'>{product.name}</h3>
                          <p className='mb-3 text-xs font-bold text-on-surface md:mb-4 md:text-lg'>{product.price}</p>
                          <div className='flex items-center justify-between rounded bg-surface-container-low p-1.5 md:p-2'>
                            <span className='text-[10px] font-medium text-on-surface-variant md:text-xs'>MSM:</span>
                            <span className='text-[10px] font-semibold md:text-sm'>{product.minOrder}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className='mb-4 text-lg font-semibold md:mb-6 md:text-2xl'>En Çok Satanlar</h2>
                  <div className='grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4'>
                    {bestSellers.map((product) => (
                      <div className='rounded-xl border border-surface-container-low bg-white p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md md:flex md:gap-4 md:p-4' key={product.name}>
                        <div className='mb-3 h-24 w-full overflow-hidden rounded-lg bg-surface-container md:mb-0 md:h-24 md:w-24 md:shrink-0'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={product.name} className='h-full w-full object-cover' src={product.image} />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <span className='rounded bg-primary-fixed px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary md:px-2 md:py-1 md:text-[10px]'>{product.badge}</span>
                          <h3 className='mt-2 line-clamp-2 text-xs font-bold text-on-surface md:text-sm'>{product.name}</h3>
                          <p className='mt-1 text-[10px] font-medium text-on-surface-variant md:text-xs'>{product.sales}</p>
                          <p className='mt-2 text-xs font-bold text-primary md:text-sm'>{product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <style jsx>{`
                  .store-category-marquee {
                    animation: store-category-scroll 28s linear infinite;
                  }

                  .store-category-marquee:hover {
                    animation-play-state: paused;
                  }

                  @keyframes store-category-scroll {
                    from {
                      transform: translateX(0);
                    }
                    to {
                      transform: translateX(-33.333%);
                    }
                  }
                `}</style>
              </section>
              ) : null}

              {showAbout ? (
              <section>
                <div className='space-y-6 rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 md:p-8'>
                  <p className='text-sm leading-relaxed text-on-surface-variant md:text-base'>
                    Global Lojistik A.Ş., 2012 yılından bu yana B2B taşımacılık ve tedarik zinciri yönetimi alanında sektörün öncü kuruluşlarından biridir. Modern filomuz ve teknolojik altyapımız ile iş ortaklarımıza şeffaf, güvenilir ve uçtan uca çözümler sunuyoruz. Amacımız, işletmelerin operasyonel yüklerini hafifleterek kendi ana iş kollarına odaklanmalarını sağlamaktır.
                  </p>

                  <div className='grid grid-cols-2 gap-4 pt-6 md:grid-cols-3 md:gap-6'>
                    {[
                      ['factory', '50.000m²', 'Depolama Alanı'],
                      ['groups', '250+', 'Uzman Personel'],
                      ['local_shipping', '1000+', 'Aylık Sevkiyat'],
                    ].map(([icon, value, label], index) => (
                      <div className={`rounded-lg bg-surface-container-low p-5 text-center md:p-6 ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`} key={label}>
                        <span className='material-symbols-outlined mb-3 text-[32px] text-primary'>{icon}</span>
                        <h3 className='mb-1 text-xl font-semibold'>{value}</h3>
                        <p className='text-xs font-semibold uppercase text-on-surface-variant'>{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {[
                      ['Office', showcaseImages.office],
                      ['Warehouse', showcaseImages.warehouse],
                    ].map(([alt, src]) => (
                      <div className='h-48 overflow-hidden rounded-lg bg-surface-container' key={alt}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={alt} className='h-full w-full object-cover' src={src} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              ) : null}

              {showProducts ? (
              <section>
                <div className='mb-6 flex items-center justify-between gap-4'>
                  <h2 className='text-2xl font-semibold'>Öne Çıkan Ürünler / Hizmetler</h2>
                  <a className='flex items-center gap-1 text-sm text-primary hover:underline' href='#'>
                    Tümünü Gör <span className='material-symbols-outlined text-[16px]'>arrow_forward</span>
                  </a>
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {products.map((product) => (
                    <div className='group overflow-hidden rounded-xl border border-surface-container-low bg-surface-container-lowest transition-all duration-300 hover:border-primary/30 hover:shadow-md' key={product.name}>
                      <div className='relative h-48 bg-surface-container'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={product.name} className='h-full w-full object-cover' src={product.image} />
                        {product.badge ? (
                          <div className='absolute left-2 top-2 rounded bg-secondary-container px-2 py-1 text-xs font-bold uppercase text-on-secondary-container'>
                            {product.badge}
                          </div>
                        ) : null}
                      </div>
                      <div className='p-5'>
                        <p className='mb-1 text-xs font-semibold uppercase text-outline'>{product.category}</p>
                        <h3 className='mb-3 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary'>{product.name}</h3>
                        <div className='mb-4 flex items-end justify-between'>
                          <div>
                            <p className='mb-1 text-xs font-medium text-on-surface-variant'>Birim Fiyatı (Tahmini)</p>
                            <p className='text-lg font-bold text-on-surface'>{product.price}</p>
                          </div>
                        </div>
                        <div className='flex items-center justify-between rounded bg-surface-container-low p-2'>
                          <span className='text-xs font-medium text-on-surface-variant'>MSM:</span>
                          <span className='text-sm font-semibold'>{product.minOrder}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              ) : null}

              {showContact ? (
              <section>
                <div className='space-y-6 rounded-xl border border-surface-container-low bg-surface-container-lowest p-4 md:p-6'>
                  <div className='relative h-72 overflow-hidden rounded-lg border border-surface-container bg-surface-container-low'>
                    <div className='absolute inset-0 bg-[linear-gradient(28deg,rgba(255,255,255,0)_0_46%,rgba(255,255,255,.85)_46%_49%,rgba(255,255,255,0)_49%),linear-gradient(118deg,rgba(255,255,255,0)_0_41%,rgba(255,255,255,.85)_41%_44%,rgba(255,255,255,0)_44%),linear-gradient(90deg,rgba(255,255,255,0)_0_34%,rgba(255,255,255,.7)_34%_36%,rgba(255,255,255,0)_36%),linear-gradient(0deg,rgba(255,255,255,0)_0_42%,rgba(255,255,255,.7)_42%_44%,rgba(255,255,255,0)_44%)] bg-[length:180px_180px,220px_220px,160px_160px,150px_150px] opacity-90' />
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_76%_38%,rgba(19,83,216,.18),transparent_22%),radial-gradient(circle_at_18%_68%,rgba(253,89,30,.12),transparent_20%),linear-gradient(135deg,#dbeafe,#f8fafc_42%,#e0f2fe)]' />
                    <div className='absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center'>
                      <div className='relative h-28 w-20'>
                        <div className='absolute left-1/2 top-0 h-24 w-20 -translate-x-1/2 rounded-t-full rounded-bl-full bg-primary shadow-xl [transform:translateX(-50%)_rotate(45deg)]' />
                        <div className='absolute left-1/2 top-6 h-8 w-8 -translate-x-1/2 rounded-full bg-white' />
                      </div>
                      <div className='-mt-2 h-7 w-28 rounded-full bg-primary/25 blur-[1px]' />
                    </div>
                    <div className='absolute bottom-4 right-4 flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm'>
                      <button className='h-9 w-9 border-r border-slate-200 text-lg font-semibold text-slate-700' type='button'>+</button>
                      <button className='h-9 w-9 text-lg font-semibold text-slate-700' type='button'>−</button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                    {contactCards.map((card) => (
                      <div className='rounded-lg border border-surface-container-low bg-white p-5' key={card.title}>
                        <div className='mb-4 flex h-9 w-9 items-center justify-center rounded bg-primary-fixed text-primary'>
                          <span className='material-symbols-outlined text-[20px]'>{card.icon}</span>
                        </div>
                        <h3 className='mb-3 text-sm font-bold text-on-surface'>{card.title}</h3>
                        <p className='text-sm leading-6 text-on-surface-variant'>{card.text}</p>
                        {card.subtext ? (
                          <p className='text-sm leading-6 text-on-surface-variant'>{card.subtext}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              ) : null}
            </div>

            <aside className='hidden lg:col-span-1 lg:block'>
              <div className='rounded-xl border border-surface-container-low bg-surface-container-lowest p-5 lg:sticky lg:top-[76px]'>
                <div className='mb-5 flex flex-col items-center text-center'>
                  <div className='mb-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/10 bg-white'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt='Global Lojistik A.Ş. logosu' className='h-full w-full object-contain p-2' src={showcaseImages.logo} />
                  </div>
                  <h3 className='text-sm font-bold leading-snug text-on-surface'>Global Lojistik A.Ş.</h3>
                  <span className='mt-2 inline-flex items-center gap-1 rounded bg-primary-container px-2 py-1 text-[10px] font-semibold uppercase text-on-primary-container'>
                    <span className='material-symbols-outlined text-[14px]'>verified</span> Onaylı Tedarikçi
                  </span>
                  <p className='mt-3 flex items-center justify-center gap-1 text-xs font-medium text-on-surface-variant'>
                    <span className='material-symbols-outlined text-[15px]'>location_on</span>
                    İstanbul, Türkiye
                  </p>
                </div>

                <div className='space-y-2'>
                  <button className='flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2.5 text-xs font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high' type='button'>
                    <span className='material-symbols-outlined text-[18px]'>add</span> Takip Et
                  </button>
                  <button className='flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary/90' type='button'>
                  <span className='material-symbols-outlined text-[20px]'>chat</span> Sohbet Et
                </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
