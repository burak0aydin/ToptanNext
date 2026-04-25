'use client';

import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ChatMessage, ChatQuote } from '@/features/chat/api/chat.api';
import { QuoteOfferCard } from './QuoteOfferCard';

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  avatarUrl?: string | null;
  senderName?: string | null;
  onAcceptQuote: (quoteId: string) => Promise<void>;
  onRejectQuote: (quoteId: string) => Promise<void>;
  onCounterQuote: (quote: ChatQuote) => void;
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
    <div className={`flex min-w-0 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'min-w-0',
          shouldRenderQuote
            ? 'w-full max-w-[360px] sm:max-w-[440px]'
            : 'max-w-[84%] sm:max-w-[68%]',
        ].join(' ')}
      >
        <div className={`mb-1 flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {!isOwn && showAvatar ? (
            <div className='h-7 w-7 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200'>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={senderName ?? 'Kullanıcı'} className='h-full w-full object-cover' src={avatarUrl} />
              ) : null}
            </div>
          ) : null}
          {!isOwn && senderName ? (
            <span className='text-[10px] font-semibold text-slate-500'>{senderName}</span>
          ) : null}
        </div>

        {sanitizedBody ? (
          <div
            className={[
              'break-words rounded-xl px-3 py-2 text-[13px] leading-relaxed shadow-sm',
              isOwn
                ? 'rounded-br bg-primary text-white'
                : 'rounded-bl border border-slate-200 bg-white text-slate-900',
            ].join(' ')}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        ) : null}

        {message.attachments.length > 0 ? (
          <div className='mt-1.5 space-y-1'>
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target='_blank'
                rel='noreferrer'
                className='block rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-primary shadow-sm hover:bg-slate-50'
              >
                {attachment.fileName}
              </a>
            ))}
          </div>
        ) : null}

        {shouldRenderQuote && message.quote ? (
          <div className='mt-1.5'>
            <QuoteOfferCard
              quote={message.quote}
              isOwn={isOwn}
              onAccept={() => onAcceptQuote(message.quote!.id)}
              onReject={() => onRejectQuote(message.quote!.id)}
              onCounter={() => onCounterQuote(message.quote!)}
            />
          </div>
        ) : null}

        <div className={`mt-1 text-[10px] text-slate-400 ${isOwn ? 'text-right' : 'text-left'}`}>
          {format(new Date(message.createdAt), 'HH:mm', { locale: tr })}
        </div>
      </div>
    </div>
  );
}
