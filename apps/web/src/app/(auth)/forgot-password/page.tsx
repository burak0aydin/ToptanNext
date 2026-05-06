'use client';

import Link from 'next/link';

const inputClass =
  'w-full pl-11 pr-4 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#9CA3AF] text-on-surface text-sm shadow-sm';
const buttonClass =
  'w-full h-[52px] bg-[#1A56DB] text-on-primary text-base font-bold rounded-xl shadow-lg shadow-[#1A56DB]/20 hover:bg-[#1353d8] active:scale-[0.98] transition-all duration-200';

function AuthTabs() {
  return (
    <div className='relative mb-7 h-12 border-b border-outline-variant/40'>
      <div className='grid h-full grid-cols-2 text-center text-[15px] font-bold leading-none'>
        <Link className='flex h-12 items-center justify-center text-on-surface-variant' href='/login'>
          Giriş Yap
        </Link>
        <Link className='flex h-12 items-center justify-center text-on-surface-variant' href='/register'>
          Üye Ol
        </Link>
      </div>
    </div>
  );
}

function VisualPanel() {
  return (
    <div className='hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden'>
      <div className='absolute inset-0 opacity-25 pointer-events-none'>
        <img alt='B2B Business Professionals' className='w-full h-full object-cover' src='/images/people.png' />
      </div>
      <div className='relative z-10'>
        <h1 className='text-4xl font-extrabold text-on-primary tracking-tight mb-4'>
          Toptan<span style={{ color: '#FF5A1F' }}>Next</span>
        </h1>
        <p className='text-on-primary-container text-lg leading-relaxed max-w-sm'>
          Türkiye&apos;nin en modern B2B ticaret ekosistemine katılarak işinizi dijital dünyada büyütün.
        </p>
      </div>
      <div className='relative z-10 grid gap-6'>
        {[
          ['verified', 'Kurumsal Doğrulama', 'Güvenli ve şeffaf işlem altyapısı.'],
          ['local_shipping', 'Global Lojistik Ağı', 'Dünya çapında hızlı ve güvenilir teslimat.'],
          ['payments', 'Güvenli Ödeme Sistemi', 'Koruma altındaki ticari işlemler.'],
          ['support_agent', '7/24 Kurumsal Destek', 'Her an yanınızda olan profesyonel ekip.'],
        ].map(([icon, title, text]) => (
          <div className='flex items-center gap-4 text-on-primary' key={title}>
            <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
              <span className='material-symbols-outlined text-white' data-icon={icon}>
                {icon}
              </span>
            </div>
            <div>
              <p className='font-semibold text-base'>{title}</p>
              <p className='text-sm opacity-80'>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className='min-h-[100dvh] flex items-center justify-center bg-[#F3F6FB] px-3 py-3 md:px-4 md:py-8'>
      <div className='w-full max-w-[1100px] grid md:grid-cols-2 md:h-[min(780px,calc(100dvh-64px))] bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl shadow-on-surface/10 border border-outline-variant/20'>
        <VisualPanel />

        <div className='relative flex flex-col justify-start overflow-hidden bg-white px-5 py-6 md:min-h-0 md:justify-center md:p-10 lg:p-12'>
          <div className='absolute inset-0 md:hidden'>
            <img alt='' className='h-full w-full object-cover opacity-[0.08]' src='/images/people.png' />
            <div className='absolute inset-0 bg-white/90' />
          </div>

          <div className='relative mx-auto flex w-full max-w-[460px] flex-col bg-transparent p-0 md:min-h-[590px] md:justify-center'>
            <div className='hidden md:mb-9 md:block md:min-h-[120px]'>
              <p className='max-w-md text-[24px] font-bold leading-tight tracking-tight text-on-surface'>
                Hesabınıza yeniden erişin
              </p>
              <p className='mt-3 max-w-md text-sm leading-6 text-on-surface-variant'>
                Kayıtlı e-posta adresinizi girin; hesabınıza yeniden ulaşmanız için gerekli bağlantıyı hazırlayalım.
              </p>
            </div>

            <AuthTabs />

            <form className='space-y-5'>
              <div className='space-y-1.5'>
                <label className='ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                  E-POSTA ADRESİ
                </label>
                <div className='relative'>
                  <span className='material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl'>
                    mail
                  </span>
                  <input className={inputClass} type='email' required />
                </div>
              </div>

              <button className={buttonClass} type='submit'>
                Sıfırlama Bağlantısı Gönder
              </button>
            </form>

            <div className='mt-6 rounded-xl border border-outline-variant/30 bg-[#F7FAFF] p-4'>
              <h3 className='flex items-center gap-2 text-xs font-bold text-on-surface'>
                <span className='material-symbols-outlined text-[17px] text-primary'>info</span>
                E-posta size ulaşmazsa;
              </h3>
              <ul className='mt-2 space-y-1 text-xs leading-relaxed text-on-surface-variant'>
                <li>Girdiğiniz e-posta adresinin doğruluğunu kontrol edin.</li>
                <li>Spam ve diğer posta klasörlerini kontrol edin.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
