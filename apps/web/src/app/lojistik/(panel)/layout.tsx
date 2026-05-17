'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { LogisticsHeader } from '../components/LogisticsHeader';
import { LogisticsSidebar } from '../components/LogisticsSidebar';

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarHidden((prev) => !prev);
  };

  const mainPaddingClass = isSidebarHidden ? 'md:pl-0' : 'md:pl-64';

  const shell = (
    <div className="h-screen overflow-hidden flex bg-slate-50">
      <LogisticsSidebar isHidden={isSidebarHidden} />

      <div className={`flex-1 flex flex-col h-full relative ${mainPaddingClass}`}>
        <LogisticsHeader onToggleSidebar={toggleSidebar} sidebarHidden={isSidebarHidden} />

        <main className="flex-1 overflow-y-auto px-4 pb-12 pt-20 sm:px-6 lg:px-8 bg-slate-50">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );

  if (pathname.startsWith('/lojistik/mesajlar')) {
    return <RequireAuth>{shell}</RequireAuth>;
  }

  return shell;
}
