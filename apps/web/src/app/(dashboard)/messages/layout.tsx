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
    <div className='flex min-h-screen flex-col bg-surface'>
      <MainHeader />

      <div className='mx-auto flex h-[calc(100vh-104px)] w-full max-w-[1600px] overflow-hidden border-x border-slate-200 bg-white'>
        <div className='w-full max-w-[420px]'>
          <ConversationList />
        </div>

        <section className='min-w-0 flex-1'>
          <div className='border-b border-slate-200 px-4 py-2 text-[11px] text-slate-500'>
            Durum: {isConnected ? 'Bağlı' : 'Bağlantı kuruluyor...'}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
