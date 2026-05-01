'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  fetchMyLogisticsOffers,
  type PartnerLogisticsOffer,
  type LogisticsOfferStatus,
} from '@/features/chat/api/chat.api';

function formatOfferStatus(status: LogisticsOfferStatus): { label: string; className: string } {
  switch (status) {
    case 'SELECTED':
      return { label: 'Teklifiniz kabul edildi', className: 'bg-emerald-100 text-emerald-700' };
    case 'REJECTED':
      return { label: 'Teklifiniz reddedildi', className: 'bg-rose-100 text-rose-700' };
    case 'DRAFT':
      return { label: 'Taslak', className: 'bg-slate-100 text-slate-700' };
    default:
      return { label: 'Teklifiniz müşteriye iletildi', className: 'bg-amber-100 text-amber-700' };
  }
}

function formatRequestRoute(offer: PartnerLogisticsOffer): string {
  return `${offer.fromCity.toLocaleUpperCase('tr-TR')} → ${offer.toCity.toLocaleUpperCase('tr-TR')}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function VerdigimTekliflerPage() {
  const router = useRouter();
  const offersQuery = useQuery({
    queryKey: ['logistics-my-offers'],
    queryFn: fetchMyLogisticsOffers,
    refetchInterval: 10_000,
  });

  const offers = useMemo(() => offersQuery.data ?? [], [offersQuery.data]);

  return (
    <div className='space-y-4'>
      <div className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Verdiğim Teklifler</h1>
        <p className='mt-1 text-sm text-slate-500'>Teklif durumlarını, rota bilgisini ve sohbet erişimini buradan takip edin.</p>
      </div>

      {offersQuery.isLoading ? (
        <div className='rounded-lg border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500'>
          Teklifleriniz yükleniyor...
        </div>
      ) : null}

      {offersQuery.isError ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700'>
          Teklifler alınamadı. Lojistik partner hesabıyla giriş yaptığınızdan emin olun.
        </div>
      ) : null}

      <div className='grid gap-4'>
        {offers.map((offer) => {
          const statusMeta = formatOfferStatus(offer.status);

          return (
            <article key={offer.id} className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'>
                      {formatRequestRoute(offer)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                    <span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700'>
                      {offer.requestStatus === 'CLOSED' ? 'Talep kapalı' : 'Talep aktif'}
                    </span>
                  </div>

                  <div>
                    <h2 className='text-lg font-bold text-slate-900'>
                      {offer.productName ?? 'Yük Talebi'}
                    </h2>
                    <p className='mt-1 text-sm text-slate-500'>
                      {offer.requesterCompanyName ?? offer.requesterName ?? 'Satıcı'} ile yapılan teklif
                    </p>
                  </div>

                  <div className='grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4'>
                    <div>
                      <div className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Teklif Tutarı</div>
                      <div className='mt-1 font-bold text-slate-900'>₺{offer.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Tahmini Süre</div>
                      <div className='mt-1 font-bold text-slate-900'>{offer.estimatedDays} gün</div>
                    </div>
                    <div>
                      <div className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Kayıt Tarihi</div>
                      <div className='mt-1 font-bold text-slate-900'>{formatDate(offer.updatedAt)}</div>
                    </div>
                    <div>
                      <div className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Kargo Tipi</div>
                      <div className='mt-1 font-bold text-slate-900'>
                        {offer.isSellerDelivery
                          ? `Satıcı teslimatı ₺${(offer.sellerDeliveryFee ?? 0).toFixed(2)}`
                          : 'Partner teslimatı'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex shrink-0 flex-col gap-2 lg:items-end'>
                  <button
                    type='button'
                    onClick={() => router.push(`/lojistik/mesajlar/${offer.conversationId}`)}
                    className='rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                  >
                    Sohbet Et
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!offersQuery.isLoading && offers.length === 0 ? (
          <div className='rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500'>
            Henüz verdiğiniz teklif yok.
          </div>
        ) : null}
      </div>
    </div>
  );
}