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

export default function PaymentPage() {
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: hasAccessToken(),
  });

  const cart = cartQuery.data;

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <MainHeader />
      <main className='mx-auto flex w-full max-w-[1280px] gap-6 px-6 py-8 lg:flex-row'>
        <section className='min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>Ödeme</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Teklif kabulünden gelen detaylar burada tutulur ve ödeme adımına hazırlanır.
            </p>
          </div>

          {!hasAccessToken() ? (
            <div className='mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5'>
              <p className='text-sm font-medium text-slate-600'>Ödemeye devam etmek için önce giriş yapmanız gerekiyor.</p>
              <Link
                className='mt-4 inline-flex rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white'
                href='/login?next=%2Fodeme'
              >
                Giriş Yap
              </Link>
            </div>
          ) : null}

          {hasAccessToken() && !cartQuery.isLoading && cart && cart.items.length === 0 ? (
            <div className='mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5'>
              <p className='text-sm font-medium text-slate-600'>Ödeme için sepetinizde henüz ürün yok.</p>
              <Link
                className='mt-4 inline-flex rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white'
                href='/sepet'
              >
                Sepete Dön
              </Link>
            </div>
          ) : null}

          <div className='mt-6 space-y-4'>
            {cart?.items.map((item) => (
              <article
                key={item.id}
                className='rounded-2xl border border-slate-200 p-4'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h2 className='text-base font-semibold text-slate-900'>{item.productName}</h2>
                    <p className='mt-1 text-sm text-slate-500'>{item.supplierName ?? 'Satıcı'}</p>
                    <p className='mt-2 text-sm font-semibold text-[#1A56DB]'>
                      {formatPrice(item.unitPrice, item.currency)} x {item.quantity}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold text-slate-900'>{formatPrice(item.lineTotal, item.currency)}</p>
                    <p className='mt-1 text-xs text-slate-500'>Genel toplam</p>
                  </div>
                </div>

                {item.quoteId ? (
                  <div className='mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm'>
                    <div className='flex items-center gap-2 font-semibold text-slate-800'>
                      <span className='material-symbols-outlined text-[18px] text-emerald-600'>verified</span>
                      Kabul edilen teklif
                    </div>
                    <div className='mt-3 space-y-2 text-sm text-slate-600'>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Ürün toplamı</span>
                        <span className='font-semibold text-slate-900'>{formatPrice(item.productTotal ?? null, item.currency)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Lojistik</span>
                        <span className='font-semibold text-slate-900'>{formatPrice(item.logisticsFee ?? null, item.currency)}</span>
                      </div>
                      {item.quoteNotes ? (
                        <p className='rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-slate-500'>
                          {item.quoteNotes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <aside className='w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:w-[360px] lg:self-start'>
          <h2 className='text-lg font-bold text-slate-900'>Ödeme Özeti</h2>
          <div className='mt-5 space-y-3 text-sm'>
            <div className='flex items-center justify-between text-slate-600'>
              <span>Toplam ürün</span>
              <span className='font-semibold text-slate-900'>{cart?.totalItems ?? 0}</span>
            </div>
            <div className='flex items-center justify-between text-slate-600'>
              <span>Toplam tutar</span>
              <span className='font-semibold text-slate-900'>
                {formatPrice(cart?.subtotal ?? null, cart?.currency ?? 'TRY')}
              </span>
            </div>
          </div>
          <button
            className={`mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition ${
              hasAccessToken() && (cart?.items.length ?? 0) > 0
                ? 'bg-[#1A56DB] text-white hover:opacity-95'
                : 'pointer-events-none bg-slate-200 text-slate-500'
            }`}
            type='button'
          >
            Ödemeyi Tamamla
          </button>
          <Link
            className='mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700'
            href='/sepet'
          >
            Sepete Dön
          </Link>
        </aside>
      </main>
    </div>
  );
}