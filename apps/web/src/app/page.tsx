import Link from 'next/link';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-8'>
      <h1 className='text-2xl font-bold text-slate-800'>ToptanNext Web</h1>
      <p className='text-slate-600'>Auth akisini test etmek icin giris veya kayit sayfasina gecin.</p>
      <div className='flex gap-3'>
        <Link className='rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700' href='/login'>
          Giris Yap
        </Link>
        <Link className='rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100' href='/register'>
          Kayit Ol
        </Link>
      </div>
    </main>
  );
}
