'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  clearAccessToken,
  getUserRoleFromToken,
  hasAccessToken,
  type AppUserRole,
} from '@/lib/auth-token';
import { requestJson } from '@/lib/api';

export function AccountNavLink() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<AppUserRole | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(hasAccessToken());
      setUserRole(getUserRoleFromToken());
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

  const handleLogout = async () => {
    try {
      await requestJson<{ loggedOut: boolean }, undefined>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Client-side token cleanup still ensures immediate logout UX.
    }

    clearAccessToken();
    setIsLoggedIn(false);
    setUserRole(null);
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <Link
        className='flex items-center gap-1.5 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
        href='/login'
      >
        <span className='material-symbols-outlined text-[25px] leading-none'>account_circle</span>
        <span className='text-[14px] font-medium'>Giriş Yap</span>
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
        className='flex items-center gap-1.5 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
        onClick={() => {
          setIsMenuOpen(false);
          router.push('/siparislerim');
        }}
      >
        <span className='material-symbols-outlined text-[25px] leading-none'>account_circle</span>
        <span className='text-[14px] font-medium'>Hesabım</span>
      </button>

      {isMenuOpen ? (
        <div className='absolute right-0 top-full z-50 w-56 pt-2'>
          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
            <div className='px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
              Hesabım
            </div>

            <Link
              className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
              href='/siparislerim'
              onClick={handleMenuItemClick}
            >
              <span className='material-symbols-outlined text-[20px]'>package_2</span>
              Siparişlerim
            </Link>

            <Link
              className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
              href='/favorilerim'
              onClick={handleMenuItemClick}
            >
              <span className='material-symbols-outlined text-[20px]'>favorite</span>
              Favorilerim
            </Link>

            <Link
              className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
              href='/kullanici-bilgilerim'
              onClick={handleMenuItemClick}
            >
              <span className='material-symbols-outlined text-[20px]'>person</span>
              Kişisel Bilgilerim
            </Link>

            {userRole === 'SUPPLIER' ? (
              <Link
                className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1A56DB]'
                href='/satici-panelim'
                onClick={handleMenuItemClick}
              >
                <span className='material-symbols-outlined text-[20px]'>storefront</span>
                Satıcı Panelim
              </Link>
            ) : null}

            <div className='my-1 border-t border-slate-100' />

            <button
              type='button'
              className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50'
              onClick={() => {
                void handleLogout();
              }}
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
