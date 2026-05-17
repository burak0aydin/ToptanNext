'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { requestJson } from '@/lib/api';
import { clearAccessToken } from '@/lib/auth-token';

export function PanelAccountMenu() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const openMenu = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsMenuOpen(true);
  };

  const closeMenuWithDelay = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
    }, 120);
  };

  const handleLogout = async () => {
    try {
      await requestJson<{ loggedOut: boolean }, undefined>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Client-side token cleanup is enough for immediate logout UX.
    }

    clearAccessToken();
    setIsMenuOpen(false);
    router.replace('/login');
    router.refresh();
  };

  return (
    <div
      className='relative'
      onMouseEnter={openMenu}
      onMouseLeave={closeMenuWithDelay}
    >
      <button
        className='flex items-center gap-1.5 text-[#1A56DB] transition-colors duration-150 hover:text-[#003FB1] active:scale-95'
        onClick={() => setIsMenuOpen((prev) => !prev)}
        type='button'
      >
        <span className='material-symbols-outlined text-[28px] leading-none'>account_circle</span>
        <span className='text-[15px] font-semibold'>Hesabım</span>
      </button>

      {isMenuOpen ? (
        <div className='absolute right-0 top-full z-50 w-52 pt-2'>
          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
            <button
              className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50'
              onClick={() => {
                void handleLogout();
              }}
              type='button'
            >
              <span className='material-symbols-outlined text-[20px]'>logout</span>
              Çıkış Yap
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
