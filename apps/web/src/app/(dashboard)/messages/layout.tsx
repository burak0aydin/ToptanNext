'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { MainHeader } from '@/app/components/MainHeader';

type MessagesLayoutProps = {
  children: ReactNode;
};

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  const pathname = usePathname();
  const isConversationSelected = pathname.startsWith('/messages/');

  return (
    <RequireAuth>
      <div className='flex h-dvh flex-col overflow-hidden bg-white md:bg-surface'>
        <div className={isConversationSelected ? 'hidden lg:block' : ''}>
          <MainHeader />
        </div>

        <div className='mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden border-slate-200 bg-white md:border-x'>
          <div
            className={[
              'min-h-0 w-full shrink-0 md:block md:max-w-[420px] md:border-r md:border-slate-200',
              isConversationSelected ? 'hidden' : 'block',
            ].join(' ')}
          >
            <ConversationList />
          </div>

          <section
            className={[
              'min-w-0 flex-1 flex-col',
              isConversationSelected ? 'flex' : 'hidden md:flex',
            ].join(' ')}
          >
            {children}
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}
