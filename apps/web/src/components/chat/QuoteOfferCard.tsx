'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChatQuote, QuoteStatus } from '@/features/chat/api/chat.api';

type QuoteOfferCardProps = {
  quote: ChatQuote;
  isBuyer: boolean;
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
  isBuyer,
  onAccept,
  onReject,
  onCounter,
}: QuoteOfferCardProps) {
  const [remaining, setRemaining] = useState(() => formatRemaining(quote.expiresAt));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(formatRemaining(quote.expiresAt));
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [quote.expiresAt]);

  const statusMeta = useMemo(() => getStatusMeta(quote.status), [quote.status]);

  return (
    <div className='rounded-2xl border border-primary/20 bg-white p-4 shadow-sm'>
      <div className='mb-3 flex items-center justify-center text-primary'>
        <span className='material-symbols-outlined text-[28px]'>verified</span>
      </div>

      <h4 className='text-center text-xl font-bold text-slate-800'>Resmi Teklif Gönderildi</h4>
      <p className='mt-2 text-center text-sm text-slate-500'>Satıcı size özel bir teklif gönderdi:</p>

      <div className='mt-3 rounded-xl bg-slate-50 px-4 py-3 text-center'>
        <div className='text-4xl font-extrabold tracking-tight text-primary'>
          ₺{quote.unitPrice.toFixed(2)}
        </div>
        <div className='text-sm font-semibold text-slate-500'>/ Birim ({quote.quantity} Adet için)</div>
      </div>

      <div className='mt-3 text-center text-xs font-medium text-slate-500'>Kalan Süre: {remaining}</div>

      {quote.status === 'PENDING' && isBuyer ? (
        <div className='mt-4 space-y-2'>
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
            className='w-full rounded-lg bg-[#B94A1F] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
          >
            Teklifi Kabul Et ve Onayla
          </button>

          <div className='flex gap-2'>
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
              className='flex-1 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60'
            >
              Teklifi Reddet
            </button>

            <button
              type='button'
              disabled={isSubmitting}
              onClick={onCounter}
              className='flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60'
            >
              Karşı Teklif Gönder
            </button>
          </div>
        </div>
      ) : (
        <div className='mt-4 flex justify-center'>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusMeta.className}`}>
            {statusMeta.text}
          </span>
        </div>
      )}

      <p className='mt-4 text-center text-xs text-slate-400'>Bu teklif {quote.currency} cinsindendir.</p>
    </div>
  );
}
