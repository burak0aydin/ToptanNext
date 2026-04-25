'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChatQuote, QuoteStatus } from '@/features/chat/api/chat.api';
import { resolveProductListingMediaUrl } from '@/features/product-listing/api/product-listing.api';

type QuoteOfferCardProps = {
  quote: ChatQuote;
  isOwn: boolean;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onCounter: () => void;
};

function getStatusMeta(status: QuoteStatus): {
  text: string;
  className: string;
} {
  switch (status) {
    case 'ACCEPTED':
      return { text: '✓ Kabul Edildi', className: 'bg-green-100 text-green-700' };
    case 'REJECTED':
      return { text: '✗ Reddedildi', className: 'bg-red-100 text-red-700' };
    case 'EXPIRED':
      return { text: 'Süresi Doldu', className: 'bg-slate-100 text-slate-700' };
    case 'CANCELED':
      return { text: 'İptal Edildi', className: 'bg-slate-100 text-slate-700' };
    case 'COUNTERED':
      return { text: 'Karşı Teklif Gönderildi', className: 'bg-blue-100 text-blue-700' };
    default:
      return { text: 'Beklemede', className: 'bg-amber-100 text-amber-700' };
  }
}

function formatRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return 'Süre doldu';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}s ${minutes}d ${seconds}sn`;
}

export function QuoteOfferCard({
  quote,
  isOwn,
  onAccept,
  onReject,
  onCounter,
}: QuoteOfferCardProps) {
  const [remaining, setRemaining] = useState('Hesaplanıyor...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRemaining(formatRemaining(quote.expiresAt));

    const timer = window.setInterval(() => {
      setRemaining(formatRemaining(quote.expiresAt));
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [quote.expiresAt]);

  const statusMeta = useMemo(() => getStatusMeta(quote.status), [quote.status]);
  const productTotal = quote.quantity * quote.unitPrice;
  const logisticsFee = quote.logisticsFee ?? 0;
  const grandTotal = productTotal + logisticsFee;
  const canRespond = quote.status === 'PENDING' && !isOwn;
  const productMessage = isOwn
    ? 'Bu teklifi karşı tarafa gönderdiniz'
    : 'Size özel bir teklif gönderildi';

  return (
    <div className='w-full overflow-hidden rounded-xl border border-primary/20 bg-white p-3 shadow-sm'>
      <div className='mb-1.5 flex items-center justify-center text-primary'>
        <span className='material-symbols-outlined text-[22px]'>verified</span>
      </div>

      <h4 className='text-center text-sm font-bold leading-tight text-slate-800 sm:text-base'>
        Resmi Teklif Gönderildi
      </h4>

      <div className='mt-2.5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-left'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white text-slate-400'>
          {quote.productImageMediaId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={quote.productName ?? 'Ürün'}
              className='h-full w-full object-cover'
              src={resolveProductListingMediaUrl(quote.productImageMediaId)}
            />
          ) : (
            <span className='material-symbols-outlined text-[18px]'>inventory_2</span>
          )}
        </div>
        <div className='min-w-0'>
          <p className='truncate text-xs font-bold text-slate-800'>{quote.productName ?? 'Ürün'}</p>
          <p className='mt-0.5 text-[11px] text-slate-500'>{productMessage}</p>
        </div>
      </div>

      <div className='mt-2.5 rounded-lg bg-slate-50 px-3 py-2.5 text-center'>
        <div className='text-2xl font-extrabold tracking-normal text-primary sm:text-3xl'>
          ₺{grandTotal.toFixed(2)}
        </div>
        <div className='mt-0.5 text-[11px] font-semibold text-slate-500 sm:text-xs'>
          Toplam teklif
        </div>
      </div>

      <div className='mt-2 grid gap-1 rounded-lg border border-slate-100 p-2 text-[11px] text-slate-600'>
        <div className='flex justify-between gap-2'>
          <span>{quote.quantity} adet x ₺{quote.unitPrice.toFixed(2)}</span>
          <span className='font-semibold'>₺{productTotal.toFixed(2)}</span>
        </div>
        <div className='flex justify-between gap-2'>
          <span>Lojistik</span>
          <span className='font-semibold'>₺{logisticsFee.toFixed(2)}</span>
        </div>
      </div>

      <div className='mt-2.5 text-center text-[11px] font-medium text-slate-500'>Kalan Süre: {remaining}</div>

      {canRespond ? (
        <div className='mt-3 space-y-2'>
          <button
            type='button'
            disabled={isSubmitting}
            onClick={async () => {
              const isConfirmed = window.confirm('Teklifi kabul etmek istediğinizden emin misiniz?');
              if (!isConfirmed) {
                return;
              }

              setIsSubmitting(true);
              try {
                await onAccept();
              } finally {
                setIsSubmitting(false);
              }
            }}
            className='w-full rounded-lg bg-[#B94A1F] py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
          >
            Teklifi Kabul Et ve Onayla
          </button>

          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            <button
              type='button'
              disabled={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await onReject();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className='rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60'
            >
              Teklifi Reddet
            </button>

            <button
              type='button'
              disabled={isSubmitting}
              onClick={onCounter}
              className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60'
            >
              Karşı Teklif Gönder
            </button>
          </div>
        </div>
      ) : (
        <div className='mt-3 flex justify-center'>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
            {statusMeta.text}
          </span>
        </div>
      )}

      <p className='mt-3 text-center text-[11px] text-slate-400'>Bu teklif {quote.currency} cinsindendir.</p>
    </div>
  );
}
