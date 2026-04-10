'use client';

import Image from 'next/image';
import { useState } from 'react';

const HERO_IMAGE_PATH = '/images/people.png';

const benefits = [
  {
    title: 'Kurumsal Doğrulama',
    description: 'Güvenli ve şeffaf işlem altyapısı.',
    icon: 'verified',
  },
  {
    title: 'Global Lojistik Ağı',
    description: 'Dünya çapında hızlı ve güvenilir teslimat.',
    icon: 'local_shipping',
  },
  {
    title: 'Güvenli Ödeme Sistemi',
    description: 'Koruma altındaki ticari işlemler.',
    icon: 'payments',
  },
  {
    title: '7/24 Kurumsal Destek',
    description: 'Her an yanınızda olan profesyonel ekip.',
    icon: 'support_agent',
  },
] as const;

export function RegisterVisualPanel() {
  const [heroLoadFailed, setHeroLoadFailed] = useState(false);

  return (
    <div className='hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden'>
      <div className='absolute inset-0 opacity-25 pointer-events-none'>
        {!heroLoadFailed ? (
          <Image
            src={HERO_IMAGE_PATH}
            alt='B2B Business Professionals'
            fill
            className='w-full h-full object-cover'
            sizes='(min-width: 768px) 550px, 0px'
            onError={() => setHeroLoadFailed(true)}
            priority
          />
        ) : (
          <div className='h-full w-full bg-brand-600' />
        )}
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
        {benefits.map((item) => (
          <div key={item.title} className='flex items-center gap-4 text-on-primary'>
            <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
              <span className='material-symbols-outlined text-white' data-icon={item.icon}>
                {item.icon}
              </span>
            </div>
            <div>
              <p className='font-semibold'>{item.title}</p>
              <p className='text-sm opacity-80'>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
