'use client';

type TypingIndicatorProps = {
  count: number;
};

export function TypingIndicator({ count }: TypingIndicatorProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <div className='px-3 py-2 text-xs font-medium text-slate-500'>
      {count === 1 ? 'Bir kullanıcı yazıyor...' : `${count} kullanıcı yazıyor...`}
    </div>
  );
}
