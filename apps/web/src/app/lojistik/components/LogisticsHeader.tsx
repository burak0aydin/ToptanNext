'use client';

import { PanelAccountMenu } from '../../components/PanelAccountMenu';

type LogisticsHeaderProps = {
  onToggleSidebar: () => void;
  sidebarHidden: boolean;
};

export function LogisticsHeader({ onToggleSidebar, sidebarHidden }: LogisticsHeaderProps) {
  const desktopOffsetClass = sidebarHidden
    ? 'md:left-0 md:w-full'
    : 'md:left-64 md:w-[calc(100%-16rem)]';

  return (
    <header
      className={`fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur sm:px-6 ${desktopOffsetClass}`}
    >
      <div className="flex items-center gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Menüyü aç/kapat"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <PanelAccountMenu />
      </div>
    </header>
  );
}
