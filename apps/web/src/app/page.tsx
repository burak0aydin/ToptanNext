import Link from 'next/link';

export default function Home() {
  const sectors = [
    {
      title: 'Oteller',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuATa7MW03Vy6yYzqUZZWXlKql0_dNKGC5WrmwRNgROWfDUJ7mBkjmIP9FWq2YhTlVn6xlVoF7H-Uv-X5x9UUgVhizGcXo6bzp4c6ZDZS25-vR9rTWVxjR-KFvtdhQ8tQgWvX9YVpdkcC-OCgW0PlszIFBvBkOo5j8CaMnEsLGncLvBFwV5lWVhZtWEvEvUq4ifyMRkj5-1oA_nSlaoAfvmWYitcbb3zF_T_PIU_s7UIb4uYwCXQcd7nYx6j0AQZJmousA39UoT3Spc',
    },
    {
      title: 'Restoran & Kafe',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDRd-YWx1Y9h-8xhSKtOMQlm0TwqIAW-zfPTy_ogsXmVLhoe1I-SPefDOqy5yxt_1SjSowJ78eVT3AEnr1LA_K8chEM6Kl4xjqBsoJte3CPADxmXYTzFhnxCGOiEExfFy2C-3juBvDayhYRYKQk3j_UWPZF2PZPPCdESYogY4z74FhJWeTmhfQAPGJvo3RlhT8gojIafkzwnjfisAXLy-I4DLN4l_EffJYV0QKaKVnvaMZ3H-RmUc4JTR-vTTB1l7ByEKwhSQFNNQk',
    },
    {
      title: 'Marketler',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCm-ZmHxv0Cfme9TEItFTgYcJDAFykW91pPvhZpaxL7eax2zUnytz2UTDPaSqjrs3M5qNZLJWgtRPn3MsNQ2808MTVmx9GC9mWWoOEILWuwpVodyFRf7cHr09zfHluGJ5le6-QQFFbmek_qPEseP5J1UTJUgcA0dBNqwyHgDxcLiGkzPu1zbL5nbdHk7fjd5Inw_YSZ0_cbupPvQz3PBd14N1rU9-EoAYYXPniQMmNOXr2GToNAeLU8Q7NeGnzTdQb-0kg1LeI-NAY',
    },
    {
      title: 'Magazalar',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdtvI5k7kdDtu-Q14MA4vRBouBwApJbssCTphD4oWW45MR9CSgvB_-ltyLjaFtyaM2Va58MNFrDMeUhbFx43egrhA0XUPW5TDUbexUICgcjheBp6xPtACn_5YLNxQ7WWS5NJRXp72f0Rhe_XI31ZRTyZTLDhH3jEAMdcqccpsX09OaLrM1x1v9XHAWoPrx_509fghLK936vVuUg4L-6U2etFM1VPQf7z6zwcJsAHVmJFSs5bzHOhG--I_D9_Zi4mjj2Jazx7MRPM',
    },
    {
      title: 'Ofisler',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAtmroIq7w4E60Hmkg7-Eyy7sONa34EnBCNUKlflIWT3lnRDZ0gecLA5wL-NVxFfdioJdRh13dvgjWeaBj6w9tSx2b91aCpBRhi7cAJYamq49TmzeGsG74gKij9tjaZONeasgf2DaT6oq8Fm3KLForX_lRwo8qK24LboWjaxgvylxB42awLLGuZoNNx-CB412MGBRp1UOkxLqpKW5mgLEvLx3N1UBeOuZ12Ga7GzJC7I054kxBn6tYfznCk9rds8z9jvImt9NzqftE',
    },
    {
      title: 'Insaat & Yapi',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBpCsF7DeAYhOtxI80pQ2C-vs4oKQz2AdDBVir-H-c21cZTys5lZWOurp76XhswIO4h27CXKv5f-UgMDJVMUCUhuqtESx6FJNd6aONSuSRZFTK6Mkp0vNWZJR8p_dy7RZ2s9A9dxX5NxzJXjqdamG6pYC_n6O7mbjytoYiGCoVJautRMhhOMPO-SHEj4loPPHrmY0uQjKVf7pPyhnPJIg3OWY2vmoff7zrg0CjPpORjpBEEdCHG9LVA06R9LEksKiNeqx3h094pKfg',
    },
    {
      title: 'Saglik & Medikal',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAD0e_Z8sTSOSJQQs73gtrxKQYa3b-xqC1jHxo8goYkisS0S-SqOo_zRMJxAM2Y1KQaD-PQpqFoP7-KNRBLKNsyQYFHS3FP3u9h8oKheoQAi986H97LQrDNGvg_cDokQmcbRc2wlEnjjzrQe0EcLG6WXEmZPU2jGIPCtJAf4Kn_O-q90jV1G950mB5hoXdYqV_iGWr0A0-6Cf4HbI8t3TWobPTxgtlwSglW-PCFtzKgVl_Fr_80qbTT1W3p_m90sjRDABED7d5En6A',
    },
    {
      title: 'Tarim & Hayvancilik',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCgbGWeUXfGR3T2SsVxOMB6uust7bL_qzIsBWP4yCUqthzOpoBSo2nEUPT67DuEtWtjPnhgE0hBSrT0uxu-EmoxaYkqmHJtF52g_LTQRa4KuqRN17lLIjHIwQ41toZ_YBu2UO66F2milJLxnMlxaM3Zm9joojn2CaVTTGW82N5tPC_FppVZg1w8gQPmrym2RDTKCw7k9_aS7GvelNZlBmH_06yoxCOgzkqK7GY9vy1iRUOSDmqOQ4aiT6wm1Ci9W1nKDC5YYkR1NmI',
    },
  ];

  const products = [
    {
      sku: 'MSM: TX-9042',
      title: 'Premium Kablosuz Gurultu Engelleyici Kulaklik',
      price: 'TL2.450 - TL2.850',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCyGffFgAGO7jcnnfx3rjq_OK93CN6UfcFeKmQe23A-cH20TiXlSd9Yf5QVe6B_8iCFQu2tE2QgPIU_o4MCq1WG5WUV2F-ODuNaqrjudtwiVBBpVExftDH5gCOI5nw4EzfpTWrhqTsLffY6PLgI-zFCrhU9cnqnCxJbGsTOoRnneGOxgXVW6dyGnQwWFAmX_y3jehayLK3rO-dSbZdCCsPHOv5sQHYqKAoW7oLA84aP9uvc6F_-u10ieOukAchEpBFV6Ab6fTihmdI',
    },
    {
      sku: 'MSM: TX-3312',
      title: 'Hafif Tabanli Profesyonel Kosu Ayakkabisi',
      price: 'TL850 - TL980',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCwQkkBIUOKiFYD0bzAR2U3StlTDtFYpe-LHPFJZBITlRzFyM1YKpcTIyW3BtD204B74M1dbrqtI8mxL-jUPBOcxEfkTegVRyrhtK9X_rovU8V7WD2gBvR3GV51rTSnfT-ACnK_yuG92wEX6NfjFVGVWqVGUdSAV7YllsVx-xwERkIP6xDGvO8DNKxSVSnYGPIXAxkbmgTrRvhCVwpgclJUXPAOotyhd1LwvlUoxM02K19tGNfx5sbzWczQCaYMSr5Ec0txHzm-Uos',
    },
    {
      sku: 'MSM: TX-1188',
      title: 'Ergonomik Fileli Ofis Calisma Koltugu',
      price: 'TL1.150 - TL1.400',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ5E4iuehvVbr3rXzlausdIiQIEDRK3AD0Qc4jKECawiOf5Y18GAa_72SipRGX81vp2Hxb7BfmkNPEhBCbZjz00Fby4DaeFcEaw35_WfENR9MS1qA8GzUtY14ykqo1InLxzSBEzv6xmH9IKIbIovKYABP6o4KBvpmZhsJgCqnMv7MzTI9E1thaZK5nmXuV8xRMIpZsO_aVmQqETwy4otshkQDQPaCMHEBuumchyh5vu1kFfZYkX1oDedMhE46bYFA0nQ-M22brMDw',
    },
    {
      sku: 'MSM: TX-5521',
      title: 'Minimalist Tasarim Akilli Kol Saati',
      price: 'TL1.120 - TL1.450',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD0XCb_Tof0DrAwcF3y1aV_fhE1C7GbRbsfZ6Ak1YF9DHx7KO3Hw91dR5p2CnDoX1ohevogkW6X7AXn_v7Uiit5JgsMKos_lzph8RTRWguwIpRukjfgEMIlXDqd4sn71znTDvV65HsU1B7xndtjURk4BUJaRrgsxMMF0TgHd-ZdkOdZg9vswb5xOiWkBFwafSUVJDKWojmAeA-z5lNceT5bqefs_4BMOJo4YyRJlLnz9VrbWaY-DvKwF4JDIWGz4G8lHcVQK9wK5s0',
    },
    {
      sku: 'MSM: TX-7733',
      title: '20000mAh Endustriyel Power Bank - Su Gecirmez',
      price: 'TL350 - TL420',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB5lMjWFwfR3tVtOzfFmMUf5fG5VZhUof-3cp3MPscPC2BsVpw1CebYQp8cYKmvMdO1Ay4v7672xLEMOeZcUEZXF87jQpScx544ftob7ZKbWzv5Hfj1oBkG9lb_1j1_Z1LOndWqO7HCgdb_gGuUmLJ4KykXZTECM9I2rDbZiU1J25Ek1524sBvNqTAOkMO96qDjZ1qAtgMr6fWS5e12hpfKJ7PqRMu3t32i4IjLktLnZ-8tRuF0yix5r3QW7y6aqVp7rB-mA2FYBmE',
    },
  ];

  return (
    <div className='bg-background text-on-surface antialiased'>
      <header className='sticky top-0 z-50 border-b border-slate-100 bg-white shadow-sm'>
        <nav className='relative mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-3'>
          <span className='text-2xl font-bold tracking-tighter text-[#003FB1]'>
            Toptan<span className='text-[#FF5A1F]'>Next</span>
          </span>

          <div className='mx-12 hidden max-w-3xl flex-1 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 lg:flex'>
            <span className='material-symbols-outlined text-outline'>search</span>
            <input
              className='w-full border-none bg-transparent text-sm text-on-surface-variant focus:ring-0'
              placeholder='Urun, kategori veya marka ara...'
              type='text'
            />
          </div>

          <div className='flex items-center gap-8'>
            <Link
              className='flex items-center gap-2 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
              href='/login'
            >
              <span className='material-symbols-outlined text-3xl'>account_circle</span>
              <div className='flex flex-col items-start leading-tight'>
                <span className='text-xs font-bold'>Giris Yap</span>
                <span className='text-[10px] text-on-surface-variant'>veya Uye Ol</span>
              </div>
            </Link>

            <button className='flex flex-col items-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'>
              <span className='material-symbols-outlined'>forum</span>
              <span className='mt-1 text-[10px] font-medium'>Mesajlar</span>
            </button>

            <button className='flex flex-col items-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'>
              <span className='material-symbols-outlined'>shopping_cart</span>
              <span className='mt-1 text-[10px] font-medium'>Sepetim</span>
            </button>
          </div>
        </nav>

        <div className='h-10 w-full border-b border-slate-200/50 bg-slate-50'>
          <div className='mx-auto flex h-full max-w-[1920px] items-center gap-8 px-6'>
            <button className='flex items-center gap-2 text-sm font-semibold text-on-surface transition-colors hover:text-primary'>
              <span className='material-symbols-outlined text-[20px]'>menu</span>
              Kategoriler
            </button>
            <a className='text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              Sektorler
            </a>
            <a className='text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              Lojistik Cozumler
            </a>
            <a className='text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              ToptanNext'te Satis Yap
            </a>
            <div className='flex-1'></div>
            <div className='flex items-center gap-4'>
              <a className='text-[10px] font-bold text-on-surface-variant transition-colors hover:text-primary' href='#'>
                App Store
              </a>
              <a className='text-[10px] font-bold text-on-surface-variant transition-colors hover:text-primary' href='#'>
                Play Store
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className='relative flex h-[400px] items-center overflow-hidden bg-slate-900'>
          <div className='absolute inset-0'>
            <img
              className='h-full w-full object-cover opacity-50'
              src='https://lh3.googleusercontent.com/aida-public/AB6AXuD4MIDmelgzGiknOErjpkKb1wOCHSfnAF95fAFfSr6c83x7VzsJS0axr00qBRoGkpITWFO0ipPHIRADHIsNJBTebzbt0Xniw_7y677gEu34kWp19NuSVZi2UTlOmCmKExpRnY_4211CcI_UPuZ3rEt2ATyUhmubYJbvuB5zmxTdyaoZgNtU-r8Pt10LveCHtFiiRyhJ8wYX-9LjV0oNvWxDBQD9xZaEOjmncfQk3zzRvF-QeZv5Yxnn8vvh5p4yPKtI-Tmpj0vUHQQ'
              alt='Modern logistics warehouse'
            />
            <div className='absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent'></div>
          </div>

          <div className='container relative z-10 mx-auto px-6'>
            <div className='max-w-2xl'>
              <h1 className='mb-4 text-4xl font-extrabold leading-tight text-white md:text-5xl'>
                Toptan Alimin Gelecegi: <span className='text-[#1A56DB]'>Toptan</span>
                <span className='text-[#FF5A1F]'>Next</span>
              </h1>
              <p className='mb-8 text-lg leading-relaxed text-slate-300'>
                Binlerce dogrulanmis tedarikci, guvenli odeme sistemleri ve global lojistik agi ile
                isletmenizi buyutun.
              </p>
              <button className='rounded-xl bg-primary px-8 py-3 text-base font-bold text-white transition-all hover:bg-primary-container active:scale-95'>
                Firsatlari Kesfet
              </button>
            </div>
          </div>

          <div className='absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2'>
            <div className='h-2.5 w-2.5 rounded-full bg-white'></div>
            <div className='h-2.5 w-2.5 rounded-full bg-white/40'></div>
            <div className='h-2.5 w-2.5 rounded-full bg-white/40'></div>
            <div className='h-2.5 w-2.5 rounded-full bg-white/40'></div>
          </div>
        </section>

        <section className='bg-white py-12'>
          <div className='container mx-auto px-6'>
            <div className='mb-8 flex items-center justify-between'>
              <h2 className='text-2xl font-bold text-on-surface'>One Cikan Sektorler</h2>
              <div className='flex items-center gap-2'>
                <button className='flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant'>
                  <span className='material-symbols-outlined'>chevron_left</span>
                </button>
                <button className='flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant'>
                  <span className='material-symbols-outlined'>chevron_right</span>
                </button>
              </div>
            </div>

            <div className='hide-scrollbar flex gap-8 overflow-x-auto pb-4 lg:justify-between'>
              {sectors.map((sector) => (
                <div key={sector.title} className='group flex min-w-[100px] flex-col items-center gap-3'>
                  <div className='h-20 w-20 overflow-hidden rounded-full border-2 border-transparent bg-surface-container-low shadow-sm transition-all group-hover:border-primary'>
                    <img className='h-full w-full object-cover' src={sector.image} alt={sector.title} />
                  </div>
                  <span className='text-center text-xs font-semibold text-on-surface group-hover:text-primary'>
                    {sector.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-[#F8FAFC] py-16'>
          <div className='container mx-auto px-6'>
            <div className='mb-10 flex items-center justify-between'>
              <h2 className='text-3xl font-bold text-on-surface'>Kesfetmeye Devam Et</h2>
              <div className='relative'>
                <select className='appearance-none rounded-lg border border-outline-variant/30 bg-white px-4 py-2 pr-10 text-sm font-medium'>
                  <option>Onerilen</option>
                  <option>En Yeniler</option>
                  <option>Fiyata Gore (Artan)</option>
                  <option>Fiyata Gore (Azalan)</option>
                </select>
                <span className='material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-outline'>
                  expand_more
                </span>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
              {products.map((product) => (
                <div
                  key={product.title}
                  className='group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md'
                >
                  <div className='aspect-square overflow-hidden bg-slate-50'>
                    <img
                      className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                      src={product.image}
                      alt={product.title}
                    />
                  </div>
                  <div className='p-4'>
                    <p className='mb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'>
                      {product.sku}
                    </p>
                    <h3 className='mb-3 min-h-[40px] line-clamp-2 text-sm font-bold text-on-surface'>
                      {product.title}
                    </h3>
                    <p className='mb-1 text-[10px] text-on-surface-variant'>Toptan Fiyat Araligi</p>
                    <div className='flex items-baseline gap-1'>
                      <span className='text-lg font-bold text-primary'>{product.price}</span>
                      <span className='text-[10px] text-on-surface-variant'>/ Adet</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-12 flex justify-center'>
              <button className='rounded-lg border border-outline-variant bg-white px-12 py-3 text-sm font-bold text-on-surface-variant shadow-sm'>
                Daha Fazla Yukle
              </button>
            </div>
          </div>
        </section>

        <section className='bg-primary py-16 text-white'>
          <div className='container mx-auto grid grid-cols-1 gap-12 px-6 md:grid-cols-3'>
            <div className='flex items-start gap-4'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10'>
                <span className='material-symbols-outlined text-3xl'>gpp_good</span>
              </div>
              <div>
                <h4 className='mb-2 text-xl font-bold'>Guvenli Odeme</h4>
                <p className='text-sm leading-relaxed text-white/70'>
                  Tum islemleriniz ToptanNext guvencesi altinda %100 korumali gerceklesir.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-4'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10'>
                <span className='material-symbols-outlined text-3xl'>local_shipping</span>
              </div>
              <div>
                <h4 className='mb-2 text-xl font-bold'>Lojistik Destegi</h4>
                <p className='text-sm leading-relaxed text-white/70'>
                  Kapidan kapiya teslimat ve gumrukleme sureclerinde tam operasyonel destek.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-4'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10'>
                <span className='material-symbols-outlined text-3xl'>support_agent</span>
              </div>
              <div>
                <h4 className='mb-2 text-xl font-bold'>7/24 Musteri Hizmetleri</h4>
                <p className='text-sm leading-relaxed text-white/70'>
                  Uzman ekibimiz sorularinizi yanitlamak ve surecleri yonetmek icin her an hazir.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t border-slate-900 bg-slate-950 py-16 text-slate-400'>
        <div className='container mx-auto px-6'>
          <div className='mb-12 grid grid-cols-1 gap-12 md:grid-cols-4'>
            <div>
              <span className='mb-6 block text-2xl font-bold text-white'>
                Toptan<span className='text-[#FF5A1F]'>Next</span>
              </span>
              <p className='mb-6 text-sm leading-relaxed'>
                Turkiye'nin lider B2B pazaryeri platformu. Ticaretin dijital mimari.
              </p>
            </div>
            <div>
              <h5 className='mb-6 font-bold text-white'>Kurumsal</h5>
              <ul className='space-y-4 text-sm'>
                <li>Hakkimizda</li>
                <li>Kariyer</li>
                <li>Yatirimci Iliskileri</li>
                <li>Basin Bultenleri</li>
              </ul>
            </div>
            <div>
              <h5 className='mb-6 font-bold text-white'>Destek</h5>
              <ul className='space-y-4 text-sm'>
                <li>Yardim Merkezi</li>
                <li>Islem Rehberi</li>
                <li>Iade Politikasi</li>
                <li>Guvenli Alisveris</li>
              </ul>
            </div>
            <div>
              <h5 className='mb-6 font-bold text-white'>Iletisim</h5>
              <ul className='space-y-4 text-sm'>
                <li>info@toptannext.com</li>
                <li>0850 000 00 00</li>
                <li>Istanbul, Turkiye</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
