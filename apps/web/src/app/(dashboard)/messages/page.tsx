export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  return (
    <div className='flex h-full min-h-0 items-center justify-center bg-slate-50 p-4 md:p-6'>
      <div className='rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center md:p-8'>
        <span className='material-symbols-outlined text-4xl text-slate-300'>chat</span>
        <h2 className='text-xl font-bold text-slate-800'>Bir konuşma seçin</h2>
        <p className='mt-2 max-w-xs text-sm text-slate-500'>Mesajları görüntülemek için soldan bir konuşma seçebilirsiniz.</p>
      </div>
    </div>
  );
}
