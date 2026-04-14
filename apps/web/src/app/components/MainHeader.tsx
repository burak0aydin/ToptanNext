import Link from 'next/link';
import { AccountNavLink } from './AccountNavLink';

export function MainHeader() {
  return (
    <header className='sticky top-0 z-50 border-b border-slate-100 bg-white shadow-sm'>
      <nav className='relative mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-3'>
        <Link className='text-2xl font-bold tracking-tighter text-[#003FB1]' href='/'>
          Toptan<span className='text-[#FF5A1F]'>Next</span>
        </Link>

        <div className='mx-12 hidden max-w-3xl flex-1 items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2 lg:flex'>
          <span className='material-symbols-outlined text-outline'>search</span>
          <input
            className='w-full border-none bg-transparent text-sm text-on-surface-variant focus:ring-0'
            placeholder='Ürün, kategori veya marka ara...'
            type='text'
          />
        </div>

        <div className='flex items-center gap-6'>
          <button
            aria-label='Mesajlar'
            className='flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>forum</span>
          </button>

          <button
            aria-label='Sepetim'
            className='flex items-center justify-center text-slate-600 transition-colors duration-150 hover:text-[#1A56DB] active:scale-95'
          >
            <span className='material-symbols-outlined text-[28px] leading-none'>shopping_cart</span>
          </button>

          <AccountNavLink />
        </div>
      </nav>

      <div className='h-10 w-full border-b border-slate-200/50 bg-slate-50'>
        <div className='mx-auto flex h-full max-w-[1920px] items-center gap-8 px-6'>
          <button className='flex items-center gap-2 text-sm font-semibold text-on-surface transition-colors hover:text-primary'>
            <span className='material-symbols-outlined text-[20px]'>menu</span>
            Kategoriler
          </button>
          <a className='text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
            Sektörler
          </a>
          <a className='text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
            Lojistik Çözümler
          </a>
          <a className='text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary' href='#'>
            ToptanNext'te Satış Yap
          </a>
          <div className='flex-1' />
          <div className='flex items-center gap-4'>
            <a className='text-[10px] font-bold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              App Store
            </a>
            <a className='text-[10px] font-bold text-on-surface-variant transition-colors hover:text-primary' href='#'>
              Play Store
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
