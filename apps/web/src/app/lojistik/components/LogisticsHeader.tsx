'use client';

import { AccountNavLink } from '../../components/AccountNavLink';

type LogisticsHeaderProps = {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
};

export function LogisticsHeader({ onToggleSidebar, sidebarCollapsed }: LogisticsHeaderProps) {
  const desktopOffsetClass = sidebarCollapsed
    ? 'md:left-20 md:w-[calc(100%-5rem)]'
    : 'md:left-64 md:w-[calc(100%-16rem)]';

  return (
    <header
      className={`fixed top-0 left-0 z-50 flex h-14 w-full items-center justify-between border-b border-slate-200/50 bg-slate-50/80 px-4 shadow-sm backdrop-blur-md sm:px-6 ${desktopOffsetClass}`}
    >
      <div className="flex items-center gap-4">
        <button
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Menüyü aç/kapat"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AccountNavLink />
      </div>
    </header>
  );
}
