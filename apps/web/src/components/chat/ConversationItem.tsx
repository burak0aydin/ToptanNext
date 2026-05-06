'use client';

import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ConversationSummary } from '@/features/chat/api/chat.api';

type ConversationItemProps = {
  conversation: ConversationSummary;
  currentUserId: string | null;
  isActive: boolean;
  basePath?: string;
  compact?: boolean;
};

export function ConversationItem({
  conversation,
  currentUserId,
  isActive,
  basePath = '/messages',
  compact = false,
}: ConversationItemProps) {
  const partner =
    conversation.participants.find((participant) => participant.userId !== currentUserId)
    ?? conversation.participants[0];

  const partnerName =
    conversation.conversationType === 'LOGISTICS'
      ? `${conversation.logisticsFromCity ?? ''}${conversation.logisticsFromCity && conversation.logisticsToCity ? ' → ' : ''}${conversation.logisticsToCity ?? ''}` || 'Lojistik Sohbeti'
      : partner?.companyName
        || partner?.fullName
        || partner?.email
        || 'Kullanıcı';

  const preview = conversation.lastMessage?.body
    || (conversation.conversationType === 'LOGISTICS'
      ? 'Lojistik sohbeti'
      : (conversation.lastMessage?.type ? `[${conversation.lastMessage.type}]` : 'Henüz mesaj yok'));
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Link
      href={`${basePath}/${conversation.id}`}
      className={[
        compact
          ? 'block rounded-xl border px-1.5 py-2 transition-colors'
          : 'block rounded-xl border px-3 py-2.5 transition-colors md:p-3',
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50',
      ].join(' ')}
    >
      <div className={compact ? 'flex flex-col items-center gap-1.5 text-center' : 'flex items-start gap-3'}>
        <div className={`${compact ? 'h-12 w-12' : 'h-10 w-10 md:h-11 md:w-11'} relative shrink-0`}>
          <div className='flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-600 md:text-sm'>
            {partner?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={partnerName} className='h-full w-full object-cover' src={partner.avatarUrl} />
            ) : (
              partnerName.slice(0, 2).toUpperCase()
            )}
          </div>
          {compact && conversation.unreadCount > 0 ? (
            <span className='absolute -right-1 -top-1 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white'>
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          ) : null}
        </div>

        <div className={compact ? 'min-w-0 w-full' : 'min-w-0 flex-1'}>
          <div className='flex items-start justify-between gap-2'>
            <h4 className={[
              compact
                ? 'line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700'
                : 'line-clamp-1 text-sm leading-tight text-slate-800 md:text-sm',
              !compact && hasUnread ? 'font-bold' : 'font-medium',
            ].join(' ')}>{partnerName}</h4>
            {!compact ? (
              <span className='shrink-0 text-[11px] font-medium text-slate-400 md:font-normal'>
              {formatDistanceToNowStrict(new Date(conversation.lastMessageAt), {
                locale: tr,
                addSuffix: true,
              })}
              </span>
            ) : null}
          </div>
          {!compact ? (
            <p className='mt-0.5 line-clamp-1 text-xs leading-snug text-slate-500'>{preview}</p>
          ) : null}

          {!compact ? (
            <div className='mt-1 flex items-center gap-2'>
            {conversation.hasPendingQuote ? (
              <span className='rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-bold text-primary'>
                TEKLİF BEKLİYOR
              </span>
            ) : null}

            {conversation.unreadCount > 0 ? (
              <span className='ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white'>
                {conversation.unreadCount}
              </span>
            ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
