'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginDtoSchema, type LoginDto } from '@toptannext/types';
import { Button, Checkbox, Input } from '@toptannext/ui';
import { useForm } from 'react-hook-form';
import { setAccessToken } from '@/lib/auth-token';
import { SocialAuthButtons } from './SocialAuthButtons';
import { useLoginMutation } from '../hooks/useAuthMutations';

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginDtoSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (payload: LoginDto) => {
    loginMutation.mutate(payload, {
      onSuccess: (result) => {
        setAccessToken(result.accessToken);
        router.push('/');
      },
    });
  };

  return (
    <>
      <SocialAuthButtons />

      <div className='my-6 flex items-center gap-4'>
        <div className='h-px flex-1 bg-slate-200' />
        <span className='text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400'>
          Veya e-posta ile
        </span>
        <div className='h-px flex-1 bg-slate-200' />
      </div>

      <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
        <label className='block'>
          <span className='mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500'>
            E-posta Adresi
          </span>
          <Input placeholder='ornek@sirket.com' type='email' autoComplete='email' {...register('email')} />
          {errors.email ? <p className='mt-1 text-xs text-red-600'>{errors.email.message}</p> : null}
        </label>

        <label className='block'>
          <span className='mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500'>
            Şifre
            <Link href='#' className='normal-case tracking-normal text-brand-600 hover:text-brand-700'>
              Şifremi Unuttum
            </Link>
          </span>
          <Input
            placeholder='••••••••'
            type='password'
            autoComplete='current-password'
            {...register('password')}
          />
          {errors.password ? <p className='mt-1 text-xs text-red-600'>{errors.password.message}</p> : null}
        </label>

        <label className='flex items-center gap-2 text-sm text-slate-600'>
          <Checkbox />
          Beni hatırla
        </label>

        {loginMutation.error ? (
          <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
            {loginMutation.error.message}
          </p>
        ) : null}

        <Button type='submit' className='w-full' disabled={isSubmitting || loginMutation.isPending}>
          {loginMutation.isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>
    </>
  );
}
