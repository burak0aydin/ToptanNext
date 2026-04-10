'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerDtoSchema, type RegisterDto } from '@toptannext/types';
import { useForm } from 'react-hook-form';
import { SocialAuthButtons } from './SocialAuthButtons';
import { useRegisterMutation } from '../hooks/useAuthMutations';

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
    <>
      <SocialAuthButtons />

      <div className='my-6 flex items-center gap-4'>
        <div className='h-px flex-1 bg-outline-variant/50' />
        <span className='text-[11px] font-semibold uppercase tracking-[0.18em] text-outline'>
          Veya E-posta ile
        </span>
        <div className='h-px flex-1 bg-outline-variant/50' />
      </div>

      <form className='space-y-5' onSubmit={handleSubmit(onSubmit)}>
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
              autoComplete='name'
              {...register('fullName')}
            />
          </div>
          {errors.fullName ? <p className='mt-1 text-xs text-red-600'>{errors.fullName.message}</p> : null}
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
              placeholder='m.yilmaz@sirket.com'
              type='email'
              autoComplete='email'
              className='w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm'
              {...register('email')}
            />
          </div>
          {errors.email ? <p className='mt-1 text-xs text-red-600'>{errors.email.message}</p> : null}
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
              placeholder='••••••••'
              type='password'
              autoComplete='new-password'
              className='w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-sm'
              {...register('password')}
            />
          </div>
          {errors.password ? <p className='mt-1 text-xs text-red-600'>{errors.password.message}</p> : null}
        </div>

        <label className='flex items-start gap-3 py-2'>
          <div className='flex items-center h-5'>
            <input
              className='w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary/20'
              type='checkbox'
              {...register('termsAccepted')}
            />
          </div>
          <span className='text-xs text-on-surface-variant leading-relaxed'>
            <a href='#' className='text-primary font-semibold hover:underline'>
              Kullanım Koşulları
            </a>{' '}
            ve{' '}
            <a href='#' className='text-primary font-semibold hover:underline'>
              Gizlilik Politikası
            </a>{' '}
            metinlerini okudum ve kabul ediyorum.
          </span>
        </label>
        {errors.termsAccepted ? (
          <p className='-mt-2 text-xs text-red-600'>{errors.termsAccepted.message}</p>
        ) : null}

        {registerMutation.error ? (
          <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
            {registerMutation.error.message}
          </p>
        ) : null}

        <button
          className='w-full py-3.5 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-surface-tint active:scale-[0.98] transition-all duration-200 uppercase tracking-wider text-sm mt-4 disabled:opacity-60'
          type='submit'
          disabled={isSubmitting || registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
        </button>
      </form>
    </>
  );
}
