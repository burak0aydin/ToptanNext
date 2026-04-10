'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className='min-h-[100dvh] flex items-center justify-center px-4 py-6 md:py-8'>
      <div className='w-full max-w-[1100px] grid md:grid-cols-2 md:h-[min(780px,calc(100dvh-64px))] bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl shadow-on-surface/5 border border-outline-variant/20'>
        <div className='hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden'>
          <div className='absolute inset-0 opacity-25 pointer-events-none'>
            <img
              alt='B2B Business Professionals'
              className='w-full h-full object-cover'
              src='/images/people.png'
            />
          </div>
          <div className='relative z-10'>
            <h1 className='text-4xl font-extrabold text-on-primary tracking-tight mb-4'>
              Toptan<span style={{ color: '#FF5A1F' }}>Next</span>
            </h1>
            <p className='text-on-primary-container text-lg leading-relaxed max-w-sm'>
              Türkiye&apos;nin en modern B2B ticaret ekosistemine katılarak işinizi dijital dünyada
              büyütün.
            </p>
          </div>
          <div className='relative z-10 grid gap-6'>
            <div className='flex items-center gap-4 text-on-primary'>
              <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
                <span className='material-symbols-outlined text-white' data-icon='verified'>
                  verified
                </span>
              </div>
              <div>
                <p className='font-semibold text-base'>Kurumsal Doğrulama</p>
                <p className='text-sm opacity-80'>Güvenli ve şeffaf işlem altyapısı.</p>
              </div>
            </div>
            <div className='flex items-center gap-4 text-on-primary'>
              <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
                <span className='material-symbols-outlined text-white' data-icon='local_shipping'>
                  local_shipping
                </span>
              </div>
              <div>
                <p className='font-semibold text-base'>Global Lojistik Ağı</p>
                <p className='text-sm opacity-80'>Dünya çapında hızlı ve güvenilir teslimat.</p>
              </div>
            </div>
            <div className='flex items-center gap-4 text-on-primary'>
              <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
                <span className='material-symbols-outlined text-white' data-icon='payments'>
                  payments
                </span>
              </div>
              <div>
                <p className='font-semibold text-base'>Güvenli Ödeme Sistemi</p>
                <p className='text-sm opacity-80'>Koruma altındaki ticari işlemler.</p>
              </div>
            </div>
            <div className='flex items-center gap-4 text-on-primary'>
              <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
                <span className='material-symbols-outlined text-white' data-icon='support_agent'>
                  support_agent
                </span>
              </div>
              <div>
                <p className='font-semibold text-base'>7/24 Kurumsal Destek</p>
                <p className='text-sm opacity-80'>Her an yanınızda olan profesyonel ekip.</p>
              </div>
            </div>
          </div>
        </div>

        <div className='p-8 md:p-10 flex flex-col justify-between bg-surface-container-lowest'>
          <div className='flex flex-col flex-grow'>
            <div className='mb-10 text-center md:text-left'>
              <h2 className='text-3xl font-bold text-on-surface mb-4 tracking-tight'>Şifrenizi mi Unuttunuz?</h2>
              <p className='text-on-surface-variant body-md leading-relaxed'>
                Endişelenmeyin, kayıtlı e-posta adresinizi girerek şifrenizi sıfırlayabilirsiniz.
              </p>
            </div>

            <form className='space-y-8'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1'>
                  E-POSTA ADRESİ
                </label>
                <div className='relative'>
                  <span className='material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl'>
                    mail
                  </span>
                  <input
                    className='w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm shadow-sm'
                    placeholder='ornek@sirket.com'
                    type='email'
                    required
                  />
                </div>
              </div>

              <button
                className='w-full py-4 bg-[#1A56DB] text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-[#1353d8] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 group'
                type='submit'
              >
                <span>Sıfırlama Bağlantısı Gönder</span>
                <span className='material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform'>
                  send
                </span>
              </button>
            </form>

            <div className='mt-10 p-5 bg-surface-container-low border border-outline-variant/30 rounded-xl'>
              <h3 className='text-sm font-bold text-on-surface mb-3 flex items-center gap-2'>
                <span className='material-symbols-outlined text-[18px] text-primary'>info</span>
                Şifre yenileme e-postası size ulaşmazsa;
              </h3>
              <ul className='space-y-2 text-xs text-on-surface-variant leading-relaxed'>
                <li className='flex gap-2'>
                  <span className='text-primary'>•</span>
                  <span>Girdiğiniz e-posta adresinin doğruluğunu kontrol ediniz.</span>
                </li>
                <li className='flex gap-2'>
                  <span className='text-primary'>•</span>
                  <span>Şifre yenileme e-postasının gelme süresi 10 dakikayı bulabilir.</span>
                </li>
                <li className='flex gap-2'>
                  <span className='text-primary'>•</span>
                  <span>Spam ve diğer posta klasörlerini kontrol ediniz.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className='mt-10 text-center'>
            <Link
              className='inline-flex items-center gap-2 text-sm text-primary font-bold hover:text-secondary-container transition-colors group'
              href='/login'
            >
              <span className='material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform'>
                arrow_back
              </span>
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
