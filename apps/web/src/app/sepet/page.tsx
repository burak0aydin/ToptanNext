'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainHeader } from '@/app/components/MainHeader';
import {
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/api/cart.api';
import { resolveProductListingMediaUrl } from '@/features/product-listing/api/product-listing.api';
import { useCartStore } from '@/features/cart/store/useCartStore';
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

export default function CartPage() {
  const queryClient = useQueryClient();
  const setTotalItems = useCartStore((state) => state.setTotalItems);
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: hasAccessToken(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, { quantity }),
    onSuccess: (cart) => {
      queryClient.setQueryData(['cart'], cart);
      setTotalItems(cart.totalItems);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: ({ cart }) => {
      queryClient.setQueryData(['cart'], cart);
      setTotalItems(cart.totalItems);
    },
  });

  const cart = cartQuery.data;

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <MainHeader />
      <main className='mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-3 pb-28 pt-4 sm:px-4 lg:flex-row lg:gap-6 lg:px-6 lg:py-8'>
        <section className='min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:rounded-2xl lg:p-6'>
          <div className='mb-4 flex items-center justify-between gap-3 lg:mb-6'>
            <div>
              <h1 className='text-xl font-bold text-slate-900 lg:text-2xl'>Sepetim</h1>
              <p className='mt-1 hidden text-sm text-slate-500 sm:block'>
                Eklediğiniz ürünleri siparişe dönüştürmeden önce burada gözden geçirebilirsiniz.
              </p>
            </div>
            <span className='shrink-0 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#1A56DB]'>
              {cart?.totalItems ?? 0} ürün
            </span>
          </div>

          {cartQuery.isLoading ? (
            <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500'>
              Sepet yükleniyor...
            </div>
          ) : null}

          {!hasAccessToken() ? (
            <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center'>
              <p className='text-sm font-medium text-slate-600'>Sepetinizi görmek için giriş yapmanız gerekiyor.</p>
              <Link
                className='mt-4 inline-flex rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white'
                href='/login?next=%2Fsepet'
              >
                Giriş Yap
              </Link>
            </div>
          ) : null}

          {hasAccessToken() && !cartQuery.isLoading && cart && cart.items.length === 0 ? (
            <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center'>
              <p className='text-sm font-medium text-slate-600'>Sepetiniz şu anda boş.</p>
              <Link
                className='mt-4 inline-flex rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white'
                href='/'
              >
                Ürünlere Dön
              </Link>
            </div>
          ) : null}

          <div className='space-y-4'>
            {cart?.items.map((item) => (
              <article
                key={item.id}
                className='flex flex-col gap-3 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center lg:rounded-2xl lg:p-4'
              >
                <Link
                  className='flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4'
                  href={`/urun/${item.productListingId}`}
                >
                  <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-24 sm:w-24 md:h-20 md:w-20'>
                    {item.imageMediaId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={item.productName}
                        className='h-full w-full object-cover'
                        src={resolveProductListingMediaUrl(item.imageMediaId)}
                      />
                    ) : (
                      <span className='material-symbols-outlined text-slate-300'>shopping_bag</span>
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h2 className='line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base'>{item.productName}</h2>
                    <p className='mt-1 truncate text-xs text-slate-500 sm:text-sm'>{item.supplierName ?? 'Satıcı'}</p>
                    {item.quoteId ? (
                      <div className='mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-900 sm:text-xs'>
                        <div className='flex items-center gap-2 font-bold'>
                          <span className='material-symbols-outlined text-[15px]'>verified</span>
                          Kabul edilen teklif özeti
                        </div>
                        <div className='mt-2 space-y-1.5'>
                          <div className='flex items-center justify-between gap-3'>
                            <span>Ürün toplamı</span>
                            <span className='font-semibold'>
                              {formatPrice(item.productTotal ?? null, item.currency)}
                            </span>
                          </div>
                          <div className='flex items-center justify-between gap-3'>
                            <span>Lojistik</span>
                            <span className='font-semibold'>
                              {formatPrice(item.logisticsFee ?? null, item.currency)}
                            </span>
                          </div>
                          <div className='flex items-center justify-between gap-3 border-t border-emerald-100 pt-1.5 text-sm font-bold'>
                            <span>Genel toplam</span>
                            <span>{formatPrice(item.lineTotal ?? null, item.currency)}</span>
                          </div>
                        </div>
                        {item.quoteNotes ? (
                          <p className='mt-2 text-[11px] leading-relaxed text-emerald-800/80'>
                            Not: {item.quoteNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <p className='mt-2 text-sm font-semibold text-[#1A56DB]'>
                      {formatPrice(item.unitPrice, item.currency)}
                    </p>
                  </div>
                </Link>

                <div className='flex w-full flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 md:w-auto md:flex-nowrap md:justify-start md:border-t-0 md:pt-0'>
                  <div className='flex items-center rounded-xl border border-slate-200 bg-white'>
                    <button
                      className='flex h-9 w-10 items-center justify-center text-slate-500 transition hover:text-[#1A56DB]'
                      disabled={updateMutation.isPending || item.quantity <= 1}
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                      type='button'
                    >
                      <span className='material-symbols-outlined text-[18px]'>remove</span>
                    </button>
                    <span className='min-w-[38px] text-center text-sm font-semibold'>{item.quantity}</span>
                    <button
                      className='flex h-9 w-10 items-center justify-center text-slate-500 transition hover:text-[#1A56DB]'
                      disabled={
                        updateMutation.isPending
                        || (item.stock !== null && item.quantity >= item.stock)
                      }
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      type='button'
                    >
                      <span className='material-symbols-outlined text-[18px]'>add</span>
                    </button>
                  </div>

                  <div className='min-w-[110px] text-right'>
                    <p className='text-sm font-bold text-slate-900'>
                      {formatPrice(item.lineTotal, item.currency)}
                    </p>
                  </div>

                  <button
                    className='rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:text-sm'
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(item.id)}
                    type='button'
                  >
                    Kaldır
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className='sticky bottom-[76px] z-30 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] lg:top-28 lg:bottom-auto lg:w-[360px] lg:self-start lg:p-6 lg:shadow-sm'>
          <h2 className='text-base font-bold text-slate-900 lg:text-lg'>Sipariş Özeti</h2>
          <div className='mt-3 space-y-2 text-sm lg:mt-5 lg:space-y-3'>
            <div className='flex items-center justify-between text-slate-600'>
              <span>Toplam ürün</span>
              <span className='font-semibold text-slate-900'>{cart?.totalItems ?? 0}</span>
            </div>
            <div className='flex items-center justify-between text-slate-600'>
              <span>Ara toplam</span>
              <span className='font-semibold text-slate-900'>
                {formatPrice(cart?.subtotal ?? null, cart?.currency ?? 'TRY')}
              </span>
            </div>
          </div>
          <Link
            className={`mt-4 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition lg:mt-6 ${
              hasAccessToken() && (cart?.items.length ?? 0) > 0
                ? 'bg-[#1A56DB] text-white hover:opacity-95'
                : 'pointer-events-none bg-slate-200 text-slate-500'
            }`}
            href='/odeme'
          >
            Ödemeye Geç
          </Link>
        </aside>
      </main>
    </div>
  );
}
