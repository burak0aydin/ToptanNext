'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MainHeader } from '../components/MainHeader';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const hideHeader = pathname === '/login' || pathname === '/register';

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      {hideHeader ? null : <MainHeader />}
      {children}
      <footer className='w-full border-t border-slate-200 dark:border-slate-800 bg-[#F7F9FB] dark:bg-slate-950'>
        <div className='flex flex-col md:flex-row justify-between items-center px-8 py-6 gap-4 max-w-7xl mx-auto'>
          <span className="text-[11px] font-['Inter'] tracking-wider uppercase text-slate-500 dark:text-slate-500">
            © 2024 ToptanNext B2B Platformu. Tüm hakları saklıdır.
          </span>
          <div className='flex gap-6'>
            <a className="text-[11px] font-['Inter'] tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-[#AE3200] transition-opacity duration-200" href='#'>
              Kullanım Koşulları
            </a>
            <a className="text-[11px] font-['Inter'] tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-[#AE3200] transition-opacity duration-200" href='#'>
              Gizlilik Politikası
            </a>
            <a className="text-[11px] font-['Inter'] tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-[#AE3200] transition-opacity duration-200" href='#'>
              KVKK
            </a>
            <a className="text-[11px] font-['Inter'] tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-[#AE3200] transition-opacity duration-200" href='#'>
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
