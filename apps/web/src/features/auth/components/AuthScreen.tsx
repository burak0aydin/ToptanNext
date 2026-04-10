import Link from 'next/link';
import { ReactNode } from 'react';

type AuthScreenProps = {
  title: string;
  description: string;
  footerPrompt: string;
  footerActionLabel: string;
  footerActionHref: string;
  children: ReactNode;
};

const highlights = [
  {
    title: 'Kurumsal Doğrulama',
    description: 'Güvenli ve şeffaf işlem altyapısı.',
  },
  {
    title: 'Global Lojistik Ağı',
    description: 'Dünya çapında hızlı ve güvenilir teslimat.',
  },
  {
    title: 'Güvenli Ödeme Sistemi',
    description: 'Koruma altındaki ticari işlemler.',
  },
  {
    title: '7/24 Kurumsal Destek',
    description: 'Her an yanınızda olan profesyonel ekip.',
  },
];

function BenefitIcon({ type }: { type: 'verified' | 'shipping' | 'payment' | 'support' }) {
  if (type === 'verified') {
    return (
      <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2'>
        <path d='m5 13 4 4L19 7' />
      </svg>
    );
  }

  if (type === 'shipping') {
    return (
      <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2'>
        <path d='M10 17h4V5H2v12h2' />
        <path d='M14 9h4l4 4v4h-2' />
        <circle cx='7' cy='17' r='2' />
        <circle cx='17' cy='17' r='2' />
      </svg>
    );
  }

  if (type === 'payment') {
    return (
      <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2'>
        <rect x='2' y='5' width='20' height='14' rx='2' />
        <path d='M2 10h20' />
        <path d='M6 15h3' />
      </svg>
    );
  }

  return (
    <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2'>
      <circle cx='12' cy='12' r='9' />
      <path d='M9 13a3 3 0 0 1 6 0' />
      <circle cx='12' cy='9' r='1' />
    </svg>
  );
}

export function AuthScreen({
  title,
  description,
  footerPrompt,
  footerActionLabel,
  footerActionHref,
  children,
}: AuthScreenProps) {
  const iconTypes: Array<'verified' | 'shipping' | 'payment' | 'support'> = [
    'verified',
    'shipping',
    'payment',
    'support',
  ];

  return (
    <main className='flex min-h-screen items-center justify-center px-4 py-12'>
      <div className='grid w-full max-w-[1100px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 md:grid-cols-2'>
        <aside className='relative hidden overflow-hidden bg-brand-700 p-10 md:flex md:flex-col md:justify-between'>
          <img
            src='https://lh3.googleusercontent.com/aida-public/AB6AXuBZzFzlQajfn-r02w3m6LvmLPENpycOp5_-QCYrJ8woqGHJANuOERnyL0p0MaRY036XGnae2hAho9w96p0JNgoKtoo_yRwYuL34XykMo3IFWJF74Ap946aa_19oykiFdHbFeyYtXyAeYPcthwl4f4RDMsAPfWQjnqTOof1SVsJX6b-5ku4jz0475PdKSHfC20Py6_69091DJ0nGQ5s3NyAOqOb2_28RXqiNniK1PrNADhL6avKry62DVYXjbEfdCPZlg-KViYPrbco'
            alt='B2B profesyonelleri'
            className='absolute inset-0 h-full w-full object-cover opacity-35'
          />
          <div className='absolute inset-0 bg-brand-700/85' />
          <div className='relative z-10'>
            <h1 className='text-4xl font-extrabold tracking-tight text-white'>
              Toptan<span className='text-accent-400'>Next</span>
            </h1>
            <p className='mt-4 max-w-sm text-base leading-relaxed text-brand-100'>
              Türkiye&apos;nin en modern B2B ticaret ekosistemine katılarak işinizi dijital dünyada
              büyütün.
            </p>
          </div>
          <ul className='relative z-10 space-y-5'>
            {highlights.map((item, index) => (
              <li key={item.title} className='flex items-start gap-3'>
                <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white'>
                  <BenefitIcon type={iconTypes[index]} />
                </span>
                <div>
                  <p className='text-base font-semibold text-white'>{item.title}</p>
                  <p className='mt-1 text-sm text-brand-100'>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className='bg-white px-8 py-8 md:px-10 md:py-10'>
          <header className='mb-8'>
            <h2 className='text-3xl font-bold tracking-tight text-slate-900'>{title}</h2>
            <p className='mt-2 text-sm text-slate-500'>{description}</p>
          </header>

          {children}

          <p className='mt-8 text-center text-sm text-slate-500'>
            {footerPrompt}{' '}
            <Link href={footerActionHref} className='font-semibold text-brand-600 hover:text-brand-700'>
              {footerActionLabel}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
