'use client';

import Image from 'next/image';
import { useState } from 'react';

const SOCIAL_PROVIDERS = [
  { name: 'Google', imagePath: '/images/google.png', fallbackChar: 'G' },
  { name: 'Facebook', imagePath: '/images/facebook.png', fallbackChar: 'f' },
  { name: 'LinkedIn', imagePath: '/images/linkedin.png', fallbackChar: 'in' },
] as const;

function SocialAuthButton({
  name,
  imagePath,
  fallbackChar,
}: {
  name: string;
  imagePath: string;
  fallbackChar: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type='button'
      className='flex items-center justify-center py-4 px-4 rounded-xl border border-outline-variant/50 hover:bg-surface-container-low transition-all duration-200 group shadow-sm'
      aria-label={name}
    >
      <span className='relative block h-6 w-6'>
        <span className='absolute inset-0 flex items-center justify-center rounded-sm bg-primary text-[11px] font-bold uppercase text-on-primary'>
          {fallbackChar}
        </span>
        {!imageFailed ? (
          <Image
            src={imagePath}
            alt={name}
            fill
            className='object-contain'
            sizes='24px'
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </span>
    </button>
  );
}

export function SocialAuthButtons() {
  return (
    <div className='grid grid-cols-3 gap-4'>
      {SOCIAL_PROVIDERS.map((provider) => (
        <SocialAuthButton
          key={provider.name}
          name={provider.name}
          imagePath={provider.imagePath}
          fallbackChar={provider.fallbackChar}
        />
      ))}
    </div>
  );
}
