'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerDtoSchema, type RegisterDto } from '@toptannext/types';
import { useForm } from 'react-hook-form';
import { useRegisterMutation } from '@/features/auth/hooks/useAuthMutations';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerDtoSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      termsAccepted: false,
    },
  });

  const onSubmit = (payload: RegisterDto) => {
    registerMutation.mutate(payload, {
      onSuccess: (result) => {
        localStorage.setItem('toptannext_access_token', result.accessToken);
        router.push('/');
      },
    });
  };

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
                <p className='font-semibold'>Kurumsal Doğrulama</p>
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
                <p className='font-semibold'>Global Lojistik Ağı</p>
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
                <p className='font-semibold'>Güvenli Ödeme Sistemi</p>
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
                <p className='font-semibold'>7/24 Kurumsal Destek</p>
                <p className='text-sm opacity-80'>Her an yanınızda olan profesyonel ekip.</p>
              </div>
            </div>
          </div>
        </div>

        <div className='p-7 md:p-10 flex flex-col justify-center bg-surface-container-lowest'>
          <div className='mb-7 text-center md:text-left'>
            <h2 className='text-2xl font-bold text-on-surface mb-2 tracking-tight'>Yeni Hesap Oluştur</h2>
            <p className='text-on-surface-variant'>Lütfen kurumsal bilgilerinizi girerek kayıt olun.</p>
          </div>

          <div className='grid grid-cols-3 gap-4 mb-6'>
            <button className='flex items-center justify-center py-3.5 px-4 rounded-xl border border-outline-variant/60 bg-white hover:bg-surface-container-low transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'>
              <img
                alt='Google'
                className='w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110'
                src='/images/google.png'
              />
            </button>
            <button className='flex items-center justify-center py-3.5 px-4 rounded-xl border border-outline-variant/60 bg-white hover:bg-surface-container-low transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'>
              <img
                alt='Facebook'
                className='w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110'
                src='/images/facebook.png'
              />
            </button>
            <button className='flex items-center justify-center py-3.5 px-4 rounded-xl border border-outline-variant/60 bg-white hover:bg-surface-container-low transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'>
              <img
                alt='LinkedIn'
                className='w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110'
                src='/images/linkedin.png'
              />
            </button>
          </div>

          <div className='relative flex py-3 items-center mb-5'>
            <div className='flex-grow border-t border-outline-variant/30'></div>
            <span className='flex-shrink mx-4 text-xs font-medium text-outline uppercase tracking-widest'>
              Veya E-posta ile
            </span>
            <div className='flex-grow border-t border-outline-variant/30'></div>
          </div>

          <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1'>
                Ad Soyad
              </label>
              <div className='relative'>
                <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl' data-icon='person'>
                  person
                </span>
                <input
                  className='w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm'
                  placeholder='Mehmet Yılmaz'
                  type='text'
                  required
                  minLength={2}
                  {...register('fullName')}
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1'>
                E-posta
              </label>
              <div className='relative'>
                <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl' data-icon='business'>
                  business
                </span>
                <input
                  className='w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm'
                  placeholder='m.yilmaz@sirket.com'
                  type='email'
                  required
                  {...register('email')}
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1'>
                Şifre
              </label>
              <div className='relative'>
                <span className='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl' data-icon='lock'>
                  lock
                </span>
                <input
                  className='w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm'
                  placeholder='••••••••'
                  type='password'
                  required
                  minLength={8}
                  {...register('password')}
                />
              </div>
            </div>

            <div className='flex items-start gap-3 py-1'>
              <div className='flex items-center h-5'>
                <input
                  className='w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary/20'
                  type='checkbox'
                  required
                  {...register('termsAccepted')}
                />
              </div>
              <label className='text-xs text-on-surface-variant leading-relaxed'>
                <a className='text-primary font-semibold hover:text-secondary-container transition-colors duration-200' href='#'>
                  Kullanım Koşulları
                </a>{' '}
                ve{' '}
                <a className='text-primary font-semibold hover:text-secondary-container transition-colors duration-200' href='#'>
                  Gizlilik Politikası
                </a>
                &apos;nı okudum ve kabul ediyorum.
              </label>
            </div>

            {registerMutation.error ? (
              <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {registerMutation.error.message}
              </p>
            ) : null}

            <button
              className='w-full py-3.5 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-surface-tint active:scale-[0.98] transition-all duration-200 uppercase tracking-wider text-sm mt-2 disabled:opacity-60'
              type='submit'
              disabled={isSubmitting || registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
            </button>
          </form>

          <div className='mt-5 text-center'>
            <p className='text-sm text-on-surface-variant'>
              Zaten üye misiniz?{' '}
              <Link className='text-primary font-bold hover:text-secondary-container transition-colors duration-200 ml-1' href='/login'>
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
