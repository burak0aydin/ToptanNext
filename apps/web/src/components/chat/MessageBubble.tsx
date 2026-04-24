'use client';

import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ChatMessage } from '@/features/chat/api/chat.api';
import { QuoteOfferCard } from './QuoteOfferCard';

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  avatarUrl?: string | null;
  senderName?: string | null;
  isBuyer: boolean;
  onAcceptQuote: (quoteId: string) => Promise<void>;
  onRejectQuote: (quoteId: string) => Promise<void>;
  onCounterQuote: (quoteId: string) => void;
};

const QUOTE_MESSAGE_TYPES = new Set([
  'QUOTE_OFFER',
  'COUNTER_OFFER',
] as const);

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  avatarUrl,
  senderName,
  isBuyer,
  onAcceptQuote,
  onRejectQuote,
  onCounterQuote,
}: MessageBubbleProps) {
  const sanitizedBody = message.body
    ? DOMPurify.sanitize(message.body)
    : null;

  const shouldRenderQuote =
    message.quote !== null && QUOTE_MESSAGE_TYPES.has(message.type as 'QUOTE_OFFER' | 'COUNTER_OFFER');

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className='max-w-[85%] sm:max-w-[75%]'>
        <div className={`mb-1 flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {!isOwn && showAvatar ? (
            <div className='h-8 w-8 overflow-hidden rounded-full bg-slate-100'>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={senderName ?? 'Kullanıcı'} className='h-full w-full object-cover' src={avatarUrl} />
              ) : null}
            </div>
          ) : null}
          {!isOwn && senderName ? (
            <span className='text-[11px] font-semibold text-slate-500'>{senderName}</span>
          ) : null}
        </div>

        {sanitizedBody ? (
          <div
            className={[
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isOwn
                ? 'rounded-br-md bg-primary text-white'
                : 'rounded-bl-md bg-slate-100 text-slate-800',
            ].join(' ')}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        ) : null}

        {message.attachments.length > 0 ? (
          <div className='mt-2 space-y-1'>
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target='_blank'
                rel='noreferrer'
                className='block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-primary hover:bg-slate-50'
              >
                {attachment.fileName}
              </a>
            ))}
          </div>
        ) : null}

        {shouldRenderQuote && message.quote ? (
          <div className='mt-2'>
            <QuoteOfferCard
              quote={message.quote}
              isBuyer={isBuyer}
              onAccept={() => onAcceptQuote(message.quote!.id)}
              onReject={() => onRejectQuote(message.quote!.id)}
              onCounter={() => onCounterQuote(message.quote!.id)}
            />
          </div>
        ) : null}

        <div className={`mt-1 text-[11px] text-slate-400 ${isOwn ? 'text-right' : 'text-left'}`}>
          {format(new Date(message.createdAt), 'HH:mm', { locale: tr })}
        </div>
      </div>
    </div>
  );
}
