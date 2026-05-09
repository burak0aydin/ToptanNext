import Image from 'next/image';

export function MainFooter() {
  return (
    <footer>
      <section className='bg-primary py-6 text-white md:py-12'>
        <div className='container mx-auto grid grid-cols-3 gap-2 px-4 md:grid-cols-3 md:gap-8 md:px-6'>
          <div className='flex min-w-0 flex-col items-center gap-2 text-center md:flex-row md:items-start md:gap-4 md:text-left'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 md:h-12 md:w-12 md:rounded-xl'>
              <span className='material-symbols-outlined text-[22px] md:text-3xl'>gpp_good</span>
            </div>
            <div className='min-w-0'>
              <h4 className='mb-1 text-[11px] font-semibold leading-tight md:mb-2 md:text-xl md:font-bold'>Güvenli Ödeme</h4>
              <p className='text-[10px] leading-snug text-white/70 md:text-sm md:leading-relaxed'>
                <span className='md:hidden'>Ödemeler korumalı.</span>
                <span className='hidden md:inline'>Tüm işlemleriniz ToptanNext güvencesi altında %100 korumalı gerçekleşir.</span>
              </p>
            </div>
          </div>
          <div className='flex min-w-0 flex-col items-center gap-2 text-center md:flex-row md:items-start md:gap-4 md:text-left'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 md:h-12 md:w-12 md:rounded-xl'>
              <span className='material-symbols-outlined text-[22px] md:text-3xl'>local_shipping</span>
            </div>
            <div className='min-w-0'>
              <h4 className='mb-1 text-[11px] font-semibold leading-tight md:mb-2 md:text-xl md:font-bold'>Lojistik Desteği</h4>
              <p className='text-[10px] leading-snug text-white/70 md:text-sm md:leading-relaxed'>
                <span className='md:hidden'>Teslimat desteği.</span>
                <span className='hidden md:inline'>Kapıdan kapıya teslimat ve gümrükleme süreçlerinde tam operasyonel destek.</span>
              </p>
            </div>
          </div>
          <div className='flex min-w-0 flex-col items-center gap-2 text-center md:flex-row md:items-start md:gap-4 md:text-left'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 md:h-12 md:w-12 md:rounded-xl'>
              <span className='material-symbols-outlined text-[22px] md:text-3xl'>support_agent</span>
            </div>
            <div className='min-w-0'>
              <h4 className='mb-1 text-[11px] font-semibold leading-tight md:mb-2 md:text-xl md:font-bold'>7/24 Destek</h4>
              <p className='text-[10px] leading-snug text-white/70 md:text-sm md:leading-relaxed'>
                <span className='md:hidden'>Her an yanınızda.</span>
                <span className='hidden md:inline'>Uzman ekibimiz sorularınızı yanıtlamak ve süreçleri yönetmek için her an hazır.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className='border-t border-slate-900 bg-slate-950 pb-[76px] pt-5 text-slate-400 md:py-16'>
        <div className='container mx-auto px-4 md:px-6'>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 md:mb-12 md:grid-cols-4 md:gap-12'>
            <div className='col-span-2 md:col-span-1'>
              <span className='mb-1.5 block text-lg font-bold text-white md:mb-6 md:text-2xl'>
                Toptan<span className='text-[#FF5A1F]'>Next</span>
              </span>
              <p className='max-w-[280px] text-[11px] leading-snug md:mb-6 md:text-sm md:leading-relaxed'>
                Türkiye&#39;nin yeni nesil B2B pazaryeri ekosistemi.
              </p>
            </div>
            <div>
              <h5 className='mb-2 text-xs font-semibold text-white md:mb-6 md:text-base md:font-bold'>Kurumsal</h5>
              <ul className='space-y-1 text-[10px] leading-snug md:space-y-4 md:text-sm'>
                <li>Hakkımızda</li>
                <li>Yatırımcı İlişkileri</li>
                <li>Basın Bültenleri</li>
              </ul>
            </div>
            <div>
              <h5 className='mb-2 text-xs font-semibold text-white md:mb-6 md:text-base md:font-bold'>Destek</h5>
              <ul className='space-y-1 text-[10px] leading-snug md:space-y-4 md:text-sm'>
                <li>Yardım Merkezi</li>
                <li>İade Politikası</li>
              </ul>
            </div>
            <div>
              <h5 className='mb-1.5 text-xs font-semibold text-white md:mb-6 md:text-base md:font-bold'>İletişim</h5>
              <ul className='space-y-1 text-[10px] leading-snug md:space-y-4 md:text-sm'>
                <li>info@toptannext.com</li>
                <li>0850 000 00 00</li>
                <li>İstanbul, Türkiye</li>
              </ul>
            </div>
            <div className='-mt-1 md:hidden'>
              <h5 className='mb-1.5 text-xs font-semibold text-white'>Mobil Uygulama</h5>
              <div className='flex flex-col gap-1.5'>
                <Image
                  alt='App Store'
                  className='h-auto w-[104px]'
                  height={44}
                  src='/images/app-store-badge.svg'
                  width={150}
                />
                <Image
                  alt='Google Play'
                  className='h-auto w-[104px]'
                  height={44}
                  src='/images/google-play-badge.svg'
                  width={150}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
