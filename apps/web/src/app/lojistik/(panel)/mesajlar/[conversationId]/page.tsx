import { Suspense } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ConversationWorkspace } from '@/components/chat/ConversationWorkspace';

type LogisticsConversationPageProps = {
  params: {
    conversationId: string;
  };
};

export default function LogisticsConversationPage({ params }: LogisticsConversationPageProps) {
  return (
    <div className='flex h-[calc(100dvh-9rem)] min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
      <div className='hidden w-full max-w-[420px] shrink-0 md:block'>
        <Suspense fallback={<div className='p-4 text-sm text-slate-500'>Mesajlar yükleniyor...</div>}>
          <ConversationList basePath='/lojistik/mesajlar' />
        </Suspense>
      </div>
      <section className='flex min-w-0 flex-1 flex-col'>
        <ConversationWorkspace conversationId={params.conversationId} />
      </section>
    </div>
  );
}
