export function MainFooter() {
  return (
    <footer>
      <section className='bg-primary py-12 text-white'>
        <div className='container mx-auto grid grid-cols-1 gap-8 px-6 md:grid-cols-3'>
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

      <section className='border-t border-slate-900 bg-slate-950 py-16 text-slate-400'>
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
      </section>
    </footer>
  );
}
