'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerDtoSchema, type RegisterDto } from '@toptannext/types';
import { useForm } from 'react-hook-form';
import { useRegisterMutation } from '@/features/auth/hooks/useAuthMutations';
import { setAccessToken } from '@/lib/auth-token';

const inputClass =
  'w-full pl-11 pr-4 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#9CA3AF] text-on-surface text-sm shadow-sm';
const plainInputClass =
  'w-full px-4 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#9CA3AF] text-on-surface text-sm shadow-sm';
const passwordInputClass =
  'w-full pl-11 pr-11 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#9CA3AF] text-on-surface text-sm shadow-sm';
const buttonClass =
  'w-full h-[52px] bg-[#1A56DB] text-on-primary text-base font-bold rounded-xl shadow-lg shadow-[#1A56DB]/20 hover:bg-[#1353d8] active:scale-[0.98] transition-all duration-200 disabled:opacity-60';

type RegisterStep = 'email' | 'accountType' | 'details';
type AccountType = 'buyer' | 'supplier' | 'logistics';

const accountTypes: Array<{
  type: AccountType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'buyer',
    title: 'Alıcı',
    description: 'Kademeli fiyatlandırma ve toplu alım avantajlarıyla ürünleri daha uygun koşullarla keşfedin.',
    icon: 'shopping_cart',
  },
  {
    type: 'supplier',
    title: 'Tedarikçi',
    description: 'Ürünlerinizi daha fazla alıcıya ulaştırın, talepleri takip edin ve satış ağınızı büyütün.',
    icon: 'storefront',
  },
  {
    type: 'logistics',
    title: 'Lojistikçi',
    description: 'Açık taşıma taleplerini görün, uygun işlere teklif verin ve yeni lojistik fırsatlarından yararlanın.',
    icon: 'local_shipping',
  },
];

function AuthTabs() {
  return (
    <div className='relative mb-6 h-11 border-b border-outline-variant/40 md:mb-9 md:h-12'>
      <div className='grid h-full grid-cols-2 text-center text-[15px] font-bold leading-none'>
        <Link className='flex h-11 items-center justify-center text-on-surface-variant md:h-12' href='/login'>
          Giriş Yap
        </Link>
        <Link className='flex h-11 items-center justify-center text-[#1A56DB] md:h-12' href='/register'>
          Üye Ol
        </Link>
      </div>
      <span className='absolute bottom-[-1px] left-1/2 h-0.5 w-1/2 rounded-full bg-[#1A56DB]' />
    </div>
  );
}

function SocialAuthArea() {
  return (
    <div className='mt-9'>
      <p className='mb-3 text-center text-xs font-medium text-on-surface-variant'>
        Sosyal hesabın ile giriş yap
      </p>
      <div className='grid grid-cols-3 gap-3'>
        {[
          ['Google', '/images/google.png'],
          ['Facebook', '/images/facebook.png'],
          ['LinkedIn', '/images/linkedin.png'],
        ].map(([name, src]) => (
          <button
            aria-label={`${name} ile giriş yap`}
            className='flex h-12 items-center justify-center rounded-xl border border-outline-variant/60 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#9AB8F6] hover:bg-[#F8FAFF] hover:shadow-md'
            key={name}
            type='button'
          >
            <img alt={name} className='h-6 w-6 object-contain' src={src} />
          </button>
        ))}
      </div>
    </div>
  );
}

function AccountTypeCard({
  description,
  icon,
  isSelected,
  onSelect,
  title,
}: {
  description: string;
  icon: string;
  isSelected: boolean;
  onSelect: () => void;
  title: string;
}) {
  return (
    <button
      className={[
        'flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-all md:gap-4 md:p-4',
        isSelected
          ? 'border-[#1A56DB] shadow-md shadow-[#1A56DB]/10 ring-2 ring-[#1A56DB]/10'
          : 'border-outline-variant/70 hover:border-[#9AB8F6] hover:shadow-sm',
      ].join(' ')}
      type='button'
      onClick={onSelect}
    >
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border md:h-5 md:w-5',
          isSelected ? 'border-[#1A56DB]' : 'border-outline-variant',
        ].join(' ')}
      >
        {isSelected ? <span className='h-2.5 w-2.5 rounded-full bg-[#1A56DB] md:h-3 md:w-3' /> : null}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block text-sm font-bold text-on-surface md:text-base'>{title}</span>
        <span className='mt-1 block text-xs leading-5 text-on-surface-variant md:text-sm'>{description}</span>
      </span>
      <span className='material-symbols-outlined shrink-0 text-2xl text-[#1A56DB] md:text-3xl'>{icon}</span>
    </button>
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
              <p className='font-semibold'>{title}</p>
              <p className='text-sm opacity-80'>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const [step, setStep] = useState<RegisterStep>('email');
  const [accountType, setAccountType] = useState<AccountType>('buyer');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerDtoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      termsAccepted: false,
    },
  });

  const continueWithEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = emailDraft.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Geçerli bir e-posta adresi giriniz.');
      return;
    }

    setEmailError('');
    setValue('email', normalizedEmail, { shouldValidate: true });
    setStep('accountType');
  };

  const continueWithAccountType = () => {
    setStep('details');
  };

  const onSubmit = (payload: RegisterDto) => {
    registerMutation.mutate(payload, {
      onSuccess: (result) => {
        setAccessToken(result.accessToken, true);
        if (accountType === 'supplier') {
          router.push('/satici-ol');
          return;
        }

        if (accountType === 'logistics') {
          router.push('/lojistik/basvuru');
          return;
        }

        router.push('/');
      },
    });
  };

  return (
    <main className='min-h-[100dvh] flex items-center justify-center bg-[#F3F6FB] px-3 py-3 md:px-4 md:py-8'>
      <div className='w-full max-w-[1100px] grid md:grid-cols-2 md:h-[min(780px,calc(100dvh-64px))] bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl shadow-on-surface/10 border border-outline-variant/20'>
        <VisualPanel />

        <div className='relative flex flex-col justify-start overflow-hidden bg-white px-5 py-5 md:min-h-0 md:justify-center md:p-10 lg:p-12'>
          <div className='absolute inset-0 md:hidden'>
            <img alt='' className='h-full w-full object-cover opacity-[0.08]' src='/images/people.png' />
            <div className='absolute inset-0 bg-white/90' />
          </div>

          <div className='relative mx-auto flex w-full max-w-[480px] flex-col bg-transparent p-0 md:min-h-[620px] md:justify-center'>
            {step !== 'accountType' ? (
              <div className='hidden md:mb-9 md:block md:min-h-[120px]'>
                <p className='max-w-md text-[24px] font-bold leading-tight tracking-tight text-on-surface'>
                  ToptanNext dünyasına katılın
                </p>
                <p className='mt-3 max-w-md text-sm leading-6 text-on-surface-variant'>
                  Size özel hesabınızı oluşturun; alışveriş, ürün keşfi ve başvuru süreçlerini tek yerden kolayca takip edin.
                </p>
              </div>
            ) : null}

            <AuthTabs />

            {step === 'email' ? (
              <form className='space-y-6' autoComplete='off' onSubmit={continueWithEmail}>
                <div className='space-y-2'>
                  <label className='ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                    E-POSTA ADRESİ
                  </label>
                  <div className='relative'>
                    <span className='material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl'>
                      mail
                    </span>
                    <input
                      className={inputClass}
                      type='email'
                      required
                      autoComplete='email'
                      value={emailDraft}
                      onChange={(event) => setEmailDraft(event.target.value)}
                    />
                  </div>
                  {emailError ? <p className='ml-1 text-xs text-red-600'>{emailError}</p> : null}
                </div>

                <button className={buttonClass} type='submit'>
                  Devam Et
                </button>
              </form>
            ) : null}

            {step === 'accountType' ? (
              <div className='space-y-4 md:space-y-5'>
                <div>
                  <h2 className='text-sm font-semibold leading-tight text-on-surface md:text-xl md:font-bold'>
                    Oluşturmak istediğiniz hesap türünü seçin
                  </h2>
                  <p className='mt-2 hidden text-sm leading-5 text-on-surface-variant md:block'>
                    Seçiminize göre hesabınızı hazırlayacak ve gerekiyorsa başvuru formuna yönlendireceğiz.
                  </p>
                </div>

                <div className='space-y-2.5 md:space-y-3'>
                  {accountTypes.map((item) => (
                    <AccountTypeCard
                      description={item.description}
                      icon={item.icon}
                      isSelected={accountType === item.type}
                      key={item.type}
                      title={item.title}
                      onSelect={() => setAccountType(item.type)}
                    />
                  ))}
                </div>

                <button className={buttonClass} type='button' onClick={continueWithAccountType}>
                  Devam Et
                </button>
              </div>
            ) : null}

            {step === 'details' ? (
              <>
                <form className='space-y-5' autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-2'>
                      <label className='ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>AD</label>
                      <div className='relative'>
                        <span className='material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl'>
                          person
                        </span>
                        <input className={inputClass} type='text' required minLength={2} autoComplete='given-name' {...register('firstName')} />
                      </div>
                      {errors.firstName ? <p className='ml-1 text-xs text-red-600'>{errors.firstName.message}</p> : null}
                    </div>
                    <div className='space-y-2'>
                      <label className='ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>SOYAD</label>
                      <input className={plainInputClass} type='text' required minLength={2} autoComplete='family-name' {...register('lastName')} />
                      {errors.lastName ? <p className='ml-1 text-xs text-red-600'>{errors.lastName.message}</p> : null}
                    </div>
                  </div>

                  <input type='hidden' {...register('email')} />

                  <div className='space-y-2'>
                    <label className='ml-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant'>
                      ŞİFRE
                    </label>
                    <div className='relative'>
                      <span className='material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl'>
                        lock
                      </span>
                      <input
                        className={passwordInputClass}
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        maxLength={20}
                        autoComplete='new-password'
                        {...register('password')}
                      />
                      <button
                        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface'
                        type='button'
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        <span className='material-symbols-outlined text-xl'>
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {errors.password ? <p className='ml-1 text-xs text-red-600'>{errors.password.message}</p> : null}
                  </div>

                  <label className='flex items-start gap-2 py-0.5 text-xs leading-relaxed text-on-surface-variant'>
                    <input
                      className='mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20'
                      type='checkbox'
                      required
                      {...register('termsAccepted')}
                    />
                    <span>
                      <a className='font-semibold text-primary hover:text-secondary-container' href='#'>
                        Kullanım Koşulları
                      </a>{' '}
                      ve{' '}
                      <a className='font-semibold text-primary hover:text-secondary-container' href='#'>
                        Gizlilik Politikası
                      </a>
                      &apos;nı kabul ediyorum.
                    </span>
                  </label>

                  {registerMutation.error ? (
                    <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                      {registerMutation.error.message}
                    </p>
                  ) : null}

                  <button className={buttonClass} type='submit' disabled={isSubmitting || registerMutation.isPending}>
                    {registerMutation.isPending ? 'Hesap Oluşturuluyor...' : 'Devam Et'}
                  </button>
                </form>
              </>
            ) : (
              null
            )}

            {step === 'email' ? <SocialAuthArea /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
