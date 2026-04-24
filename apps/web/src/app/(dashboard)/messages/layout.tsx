'use client';

import type { ReactNode } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { MainHeader } from '@/app/components/MainHeader';

type MessagesLayoutProps = {
  children: ReactNode;
};

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  const { isConnected } = useSocket();

  return (
    <div className='flex h-dvh flex-col overflow-hidden bg-surface'>
      <MainHeader />

      <div className='mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden border-x border-slate-200 bg-white'>
        <div className='hidden w-full max-w-[420px] shrink-0 border-r border-slate-200 md:block'>
          <ConversationList />
        </div>

        <section className='flex min-w-0 flex-1 flex-col'>
          <div className='border-b border-slate-200 px-4 py-2 text-[11px] text-slate-500'>
            Durum: {isConnected ? 'Bağlı' : 'Bağlantı kuruluyor...'}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
