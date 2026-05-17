'use client';

import { useEffect, useRef, useState } from 'react';

const storeNavItems = ['Kategoriler', 'Anasayfa', 'Hakkımızda', 'İletişim'];

export function StoreProfileNav() {
  const navRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const updateStickyState = () => {
      const nav = navRef.current;
      if (!nav) {
        return;
      }

      const headerOffset = window.innerWidth >= 1024 ? 65 : 64;
      setIsStuck(nav.getBoundingClientRect().top <= headerOffset + 1);
    };

    updateStickyState();
    window.addEventListener('scroll', updateStickyState, { passive: true });
    window.addEventListener('resize', updateStickyState);

    return () => {
      window.removeEventListener('scroll', updateStickyState);
      window.removeEventListener('resize', updateStickyState);
    };
  }, []);

  return (
    <div
      className={[
        'sticky top-[64px] z-40 mb-12 ml-[calc(50%-50vw)] w-screen border-b border-surface-container-high px-4 transition-all duration-300 ease-out sm:px-8 lg:top-[65px]',
        isStuck
          ? 'translate-y-0 bg-white/95 shadow-md backdrop-blur'
          : 'translate-y-0 bg-background shadow-sm',
      ].join(' ')}
      ref={navRef}
    >
      <div className='mx-auto flex max-w-7xl overflow-x-auto'>
        {storeNavItems.map((item) => (
          <a
            className={[
              'shrink-0 px-6 py-4 text-sm font-semibold transition-colors',
              item === 'Hakkımızda'
                ? 'border-b-2 border-primary bg-surface-container-low/50 text-primary'
                : 'border-b-2 border-transparent text-on-surface-variant hover:border-primary hover:text-primary',
            ].join(' ')}
            href='#'
            key={item}
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}
