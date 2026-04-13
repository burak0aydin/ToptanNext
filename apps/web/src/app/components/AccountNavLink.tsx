'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ACCESS_TOKEN_KEY = 'toptannext_access_token';

export function AccountNavLink() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY)));
    };

    syncLoginState();

    window.addEventListener('storage', syncLoginState);
    window.addEventListener('focus', syncLoginState);

    return () => {
      window.removeEventListener('storage', syncLoginState);
      window.removeEventListener('focus', syncLoginState);

      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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

  const handleLogout = () => {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  if (!isLoggedIn) {
    return (
      <Link
        className='flex items-center gap-2 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
        href='/login'
      >
        <span className='material-symbols-outlined text-[28px] leading-none'>account_circle</span>
        <span className='text-xs font-bold'>Giriş Yap</span>
      </Link>
    );
  }

  return (
    <div
      className='relative'
      onMouseEnter={openMenu}
      onMouseLeave={closeMenuWithDelay}
    >
      <button
        type='button'
        className='flex items-center gap-2 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <span className='material-symbols-outlined text-[28px] leading-none'>account_circle</span>
        <span className='text-xs font-bold'>Profilim</span>
      </button>

        {isMenuOpen ? (
          <div className='absolute right-0 top-full z-50 w-56 pt-2'>
            <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
              <div className='px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                Hesabım
              </div>

              <button
                type='button'
                className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
              >
                <span className='material-symbols-outlined text-[20px]'>receipt_long</span>
                Siparişlerim
              </button>

              <button
                type='button'
                className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
              >
                <span className='material-symbols-outlined text-[20px]'>favorite</span>
                Favorilerim
              </button>

              <button
                type='button'
                className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
              >
                <span className='material-symbols-outlined text-[20px]'>person</span>
                Kullanıcı Bilgilerim
              </button>

              <div className='my-1 border-t border-slate-100' />

              <button
                type='button'
                className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50'
                onClick={handleLogout}
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
