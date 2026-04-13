'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ACCESS_TOKEN_KEY = 'toptannext_access_token';

export function AccountNavLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    };
  }, []);

  return (
    <Link
      className='flex items-center gap-2 text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
      href={isLoggedIn ? '/' : '/login'}
    >
      <span className='material-symbols-outlined text-3xl'>account_circle</span>
      <span className='text-xs font-bold'>{isLoggedIn ? 'Profilim' : 'Giris Yap'}</span>
    </Link>
  );
}
