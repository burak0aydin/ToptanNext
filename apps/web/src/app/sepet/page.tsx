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
      <main className='mx-auto flex w-full max-w-[1280px] gap-6 px-6 py-8 lg:flex-row'>
        <section className='min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-slate-900'>Sepetim</h1>
              <p className='mt-1 text-sm text-slate-500'>
                Eklediğiniz ürünleri siparişe dönüştürmeden önce burada gözden geçirebilirsiniz.
              </p>
            </div>
            <span className='rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#1A56DB]'>
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
                className='flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center'
              >
                <Link
                  className='flex min-w-0 flex-1 items-center gap-4'
                  href={`/urun/${item.productListingId}`}
                >
                  <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
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
                  <div className='min-w-0'>
                    <h2 className='truncate text-base font-semibold text-slate-900'>{item.productName}</h2>
                    <p className='mt-1 text-sm text-slate-500'>{item.supplierName ?? 'Satıcı'}</p>
                    <p className='mt-2 text-sm font-semibold text-[#1A56DB]'>
                      {formatPrice(item.unitPrice, item.currency)}
                    </p>
                  </div>
                </Link>

                <div className='flex items-center gap-3 self-end md:self-auto'>
                  <div className='flex items-center rounded-xl border border-slate-200 bg-white'>
                    <button
                      className='px-3 py-2 text-slate-500 transition hover:text-[#1A56DB]'
                      disabled={updateMutation.isPending || item.quantity <= 1}
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                      type='button'
                    >
                      <span className='material-symbols-outlined text-[18px]'>remove</span>
                    </button>
                    <span className='min-w-[42px] text-center text-sm font-semibold'>{item.quantity}</span>
                    <button
                      className='px-3 py-2 text-slate-500 transition hover:text-[#1A56DB]'
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

                  <div className='min-w-[120px] text-right'>
                    <p className='text-sm font-bold text-slate-900'>
                      {formatPrice(item.lineTotal, item.currency)}
                    </p>
                  </div>

                  <button
                    className='rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50'
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

        <aside className='w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:w-[360px] lg:self-start'>
          <h2 className='text-lg font-bold text-slate-900'>Sipariş Özeti</h2>
          <div className='mt-5 space-y-3 text-sm'>
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
            className={`mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition ${
              hasAccessToken() && (cart?.items.length ?? 0) > 0
                ? 'bg-[#1A56DB] text-white hover:opacity-95'
                : 'pointer-events-none bg-slate-200 text-slate-500'
            }`}
            href='/siparis'
          >
            Siparişe Geç
          </Link>
        </aside>
      </main>
    </div>
  );
}
