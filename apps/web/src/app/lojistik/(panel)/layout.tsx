'use client';

import { useState } from 'react';
import { LogisticsHeader } from '../components/LogisticsHeader';
import { LogisticsSidebar } from '../components/LogisticsSidebar';

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const mainPaddingClass = isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64';

  return (
    <div className="h-screen overflow-hidden flex bg-slate-50">
      <LogisticsSidebar isCollapsed={isSidebarCollapsed} />

      <div className={`flex-1 flex flex-col h-full relative ${mainPaddingClass}`}>
        <LogisticsHeader onToggleSidebar={toggleSidebar} sidebarCollapsed={isSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto pt-12 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
