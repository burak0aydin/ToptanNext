import { Suspense } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';

export default function LogisticsMessagesPage() {
  return (
    <div className='flex h-[calc(100dvh-9rem)] min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
      <div className='w-full max-w-[420px] shrink-0'>
        <Suspense fallback={<div className='p-4 text-sm text-slate-500'>Mesajlar yükleniyor...</div>}>
          <ConversationList basePath='/lojistik/mesajlar' />
        </Suspense>
      </div>
      <div className='flex min-w-0 flex-1 items-center justify-center bg-slate-50 p-8 text-center'>
        <div>
          <h1 className='text-xl font-bold text-slate-900'>Bir sohbet seçin</h1>
          <p className='mt-2 max-w-sm text-sm text-slate-500'>
            Teklif verdiğiniz yük ilanlarındaki satıcı sohbetleri solda görünür.
          </p>
        </div>
      </div>
    </div>
  );
}
