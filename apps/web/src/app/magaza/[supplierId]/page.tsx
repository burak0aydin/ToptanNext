import { MainHeader } from '@/app/components/MainHeader';
import { StoreProfileNav } from './StoreProfileNav';

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

export default function StoreProfilePage() {
  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface'>
      <MainHeader />

      <main className='flex-1'>
        <div className='h-80 w-full overflow-hidden bg-surface-container-high'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt='Warehouse Banner' className='h-full w-full object-cover opacity-80' src={showcaseImages.banner} />
        </div>

        <div className='relative z-10 mx-auto -mt-24 mb-12 max-w-7xl px-4 sm:px-8'>
          <div className='flex flex-col items-start justify-between rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 shadow-lg md:flex-row md:items-center md:p-8'>
            <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
              <div className='flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/10 bg-white'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt='Supplier Logo' className='h-full w-full object-contain p-2' src={showcaseImages.logo} />
              </div>

              <div>
                <div className='mb-2 flex flex-wrap items-center gap-3'>
                  <h1 className='text-2xl font-bold text-on-surface md:text-3xl'>Global Lojistik A.Ş.</h1>
                  <span className='flex items-center gap-1 rounded bg-primary-container px-2 py-1 text-xs font-semibold uppercase text-on-primary-container'>
                    <span className='material-symbols-outlined text-[16px]'>verified</span> Onaylı Tedarikçi
                  </span>
                </div>
                <p className='mb-4 flex items-center gap-2 text-sm text-on-surface-variant'>
                  <span className='material-symbols-outlined text-[18px]'>location_on</span> İstanbul, Türkiye
                </p>
                <div className='flex flex-wrap gap-4'>
                  <button className='rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90' type='button'>
                    Takip Et
                  </button>
                  <button className='flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-low px-6 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container' type='button'>
                    <span className='material-symbols-outlined'>chat</span> Sohbet Et
                  </button>
                </div>
              </div>
            </div>

            <div className='mt-6 flex gap-8 md:mt-0'>
              {[
                ['4.8', 'Mağaza Puanı'],
                ['12 Yıl', 'Platformda'],
                ['%98', 'Yanıt Oranı'],
              ].map(([value, label]) => (
                <div className='text-center' key={label}>
                  <p className='text-xl font-bold text-on-surface'>{value}</p>
                  <p className='text-xs font-semibold uppercase text-on-surface-variant'>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <StoreProfileNav />

          <div className='grid grid-cols-1 gap-8 lg:grid-cols-5'>
            <div className='space-y-16 lg:col-span-4'>
              <section>
                <h2 className='mb-6 text-2xl font-semibold'>Hakkımızda</h2>
                <div className='space-y-6 rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 md:p-8'>
                  <p className='text-sm leading-relaxed text-on-surface-variant md:text-base'>
                    Global Lojistik A.Ş., 2012 yılından bu yana B2B taşımacılık ve tedarik zinciri yönetimi alanında sektörün öncü kuruluşlarından biridir. Modern filomuz ve teknolojik altyapımız ile iş ortaklarımıza şeffaf, güvenilir ve uçtan uca çözümler sunuyoruz. Amacımız, işletmelerin operasyonel yüklerini hafifleterek kendi ana iş kollarına odaklanmalarını sağlamaktır.
                  </p>

                  <div className='grid grid-cols-1 gap-6 pt-6 md:grid-cols-3'>
                    {[
                      ['factory', '50.000m²', 'Depolama Alanı'],
                      ['groups', '250+', 'Uzman Personel'],
                      ['local_shipping', '1000+', 'Aylık Sevkiyat'],
                    ].map(([icon, value, label]) => (
                      <div className='rounded-lg bg-surface-container-low p-6 text-center' key={label}>
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
            </div>

            <aside className='lg:col-span-1'>
              <div className='rounded-xl border border-surface-container-low bg-surface-container-lowest p-5 lg:sticky lg:top-[133px]'>
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
                  <button className='flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/30 bg-white px-3 py-2.5 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-low' type='button'>
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

      <footer className='mt-auto flex w-full flex-col items-center gap-6 bg-surface-container-highest px-8 py-12'>
        <div className='text-xl font-bold text-primary'>ToptanNext</div>
        <div className='flex flex-wrap justify-center gap-6'>
          {['Kullanım Koşulları', 'Gizlilik Politikası', 'Yardım Merkezi', 'Satıcı Ol'].map((item) => (
            <a className='text-sm text-on-surface-variant transition-opacity hover:text-primary hover:opacity-80' href='#' key={item}>
              {item}
            </a>
          ))}
        </div>
        <p className='mt-4 text-center text-sm text-on-surface-variant'>© 2024 ToptanNext B2B Platformu. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
