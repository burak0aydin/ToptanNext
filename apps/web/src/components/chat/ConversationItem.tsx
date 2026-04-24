'use client';

import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ConversationSummary } from '@/features/chat/api/chat.api';

type ConversationItemProps = {
  conversation: ConversationSummary;
  currentUserId: string | null;
  isActive: boolean;
};

export function ConversationItem({
  conversation,
  currentUserId,
  isActive,
}: ConversationItemProps) {
  const partner =
    conversation.participants.find((participant) => participant.userId !== currentUserId)
    ?? conversation.participants[0];

  const partnerName =
    partner?.companyName
    || partner?.fullName
    || partner?.email
    || 'Kullanıcı';

  const preview = conversation.lastMessage?.body
    || (conversation.lastMessage?.type ? `[${conversation.lastMessage.type}]` : 'Henüz mesaj yok');

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={[
        'block rounded-xl border p-3 transition-colors',
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50',
      ].join(' ')}
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600'>
          {partner?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={partnerName} className='h-full w-full object-cover' src={partner.avatarUrl} />
          ) : (
            partnerName.slice(0, 2).toUpperCase()
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <h4 className='line-clamp-1 text-sm font-bold text-slate-800'>{partnerName}</h4>
            <span className='shrink-0 text-[11px] text-slate-400'>
              {formatDistanceToNowStrict(new Date(conversation.lastMessageAt), {
                locale: tr,
                addSuffix: true,
              })}
            </span>
          </div>
          <p className='mt-1 line-clamp-2 text-xs text-slate-500'>{preview}</p>

          <div className='mt-2 flex items-center gap-2'>
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
        </div>
      </div>
    </Link>
  );
}
