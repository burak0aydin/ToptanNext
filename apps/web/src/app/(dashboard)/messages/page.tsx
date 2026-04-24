import { ConversationList } from '@/components/chat/ConversationList';

export default function MessagesPage() {
  return (
    <div className='flex h-full min-h-0 bg-slate-50 md:items-center md:justify-center md:p-6'>
      <div className='h-full w-full bg-white md:hidden'>
        <ConversationList />
      </div>

      <div className='hidden rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center md:block'>
        <h2 className='text-xl font-bold text-slate-800'>Bir konuşma seçin</h2>
        <p className='mt-2 text-sm text-slate-500'>Mesajları görüntülemek için soldan bir konuşma seçebilirsiniz.</p>
      </div>
    </div>
  );
}
