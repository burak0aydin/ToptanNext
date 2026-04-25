'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MainHeader } from '@/app/components/MainHeader';
import { fetchCart } from '@/features/cart/api/cart.api';
import { hasAccessToken } from '@/lib/auth-token';

function formatPrice(value: string | null, currency: string): string {
  if (!value) {
    return 'Fiyat bilgisi yok';
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export default function OrderPage() {
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: hasAccessToken(),
  });

  const cart = cartQuery.data;

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <MainHeader />
      <main className='mx-auto max-w-[900px] px-6 py-10'>
        <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h1 className='text-2xl font-bold text-slate-900'>Siparişe Geç</h1>
          <p className='mt-2 text-sm text-slate-500'>
            Bu ekran sepetten sipariş akışına geçiş için hazırlandı. Sepetteki ürünler ve toplam tutar burada
            sipariş özeti olarak taşınıyor.
          </p>

          {!hasAccessToken() ? (
            <div className='mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5'>
              <p className='text-sm font-medium text-slate-600'>Siparişe devam etmek için önce giriş yapmanız gerekiyor.</p>
            </div>
          ) : null}

          <div className='mt-6 rounded-2xl bg-slate-50 p-5'>
            <div className='flex items-center justify-between text-sm text-slate-600'>
              <span>Sepetteki ürün adedi</span>
              <span className='font-semibold text-slate-900'>{cart?.totalItems ?? 0}</span>
            </div>
            <div className='mt-3 flex items-center justify-between text-sm text-slate-600'>
              <span>Toplam tutar</span>
              <span className='font-semibold text-slate-900'>
                {formatPrice(cart?.subtotal ?? null, cart?.currency ?? 'TRY')}
              </span>
            </div>
          </div>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              className='inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700'
              href='/sepet'
            >
              Sepete Dön
            </Link>
            <button
              className='inline-flex rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white'
              type='button'
            >
              Sipariş Bilgilerini Tamamla
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
