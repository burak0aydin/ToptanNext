'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageThread } from '@/components/chat/MessageThread';
import { QuoteOfferModal } from '@/components/chat/QuoteOfferModal';
import { fetchConversationById, fetchConversations } from '@/features/chat/api/chat.api';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { getCurrentUserIdFromToken } from '@/features/chat/utils/auth';
import { resolveProductListingMediaUrl } from '@/features/product-listing/api/product-listing.api';

type ProductChatDrawerProps = {
  conversationId: string | null;
  open: boolean;
  canSendQuote: boolean;
  onClose: () => void;
};

export function ProductChatDrawer({
  conversationId,
  open,
  canSendQuote,
  onClose,
}: ProductChatDrawerProps) {
  const { socket } = useSocket();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(conversationId);
  const currentUserId = getCurrentUserIdFromToken();

  const activeConversationId = selectedConversationId ?? conversationId;

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [conversationId]);

  const conversationQuery = useQuery({
    queryKey: ['chat', 'conversation', activeConversationId],
    queryFn: () => fetchConversationById(activeConversationId ?? ''),
    enabled: open && Boolean(activeConversationId),
  });

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'product-drawer-conversations'],
    queryFn: () => fetchConversations({ filter: 'all' }),
    enabled: open,
  });

  const productHref = conversationQuery.data?.productListingId
    ? `/urun/${conversationQuery.data.productListingId}`
    : null;
  const productImageUrl = conversationQuery.data?.productImageMediaId
    ? resolveProductListingMediaUrl(conversationQuery.data.productImageMediaId)
    : null;

  if (!open || !activeConversationId) {
    return null;
  }

  const conversations = conversationsQuery.data ?? [];

  return (
    <div className='fixed inset-x-0 bottom-0 z-[110] lg:inset-y-6 lg:left-auto lg:right-6'>
      <div className='flex h-[min(84dvh,760px)] w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl lg:h-full lg:w-[min(96vw,980px)] lg:rounded-2xl'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2'>
            {productHref ? (
              <Link
                href={productHref}
                className='flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-slate-50'
              >
                <span className='flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400'>
                  {productImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={conversationQuery.data?.productName ?? 'Ürün'}
                      className='h-full w-full object-cover'
                      src={productImageUrl}
                    />
                  ) : (
                    <span className='material-symbols-outlined text-[19px]'>inventory_2</span>
                  )}
                </span>
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-bold leading-tight text-slate-900'>
                    {conversationQuery.data?.productName ?? 'Ürün'}
                  </span>
                  <span className='block text-[11px] font-medium text-slate-400'>Ürünü görüntüle</span>
                </span>
              </Link>
            ) : (
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-bold text-slate-900'>Ürün sohbeti</p>
                <p className='text-[11px] font-medium text-slate-400'>Tedarikçi ile mesajlaşma</p>
              </div>
            )}
            <button
              aria-label='Sohbeti kapat'
              className='flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900'
              onClick={onClose}
              type='button'
            >
              <span className='material-symbols-outlined'>close</span>
            </button>
          </div>

        <div className='min-h-0 flex-1'>
          <MessageThread conversationId={activeConversationId} showHeader={false} />
        </div>

        <MessageInput
          compact
          canSendQuote={canSendQuote}
          conversationId={activeConversationId}
          onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
        />
        </div>

        <aside className='hidden w-[310px] shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col'>
          <div className='flex h-[65px] shrink-0 items-center gap-2 border-b border-slate-200 px-4'>
            <span className='material-symbols-outlined text-primary'>forum</span>
            <h3 className='text-lg font-bold text-slate-900'>Mesajlar</h3>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto'>
            {conversations.map((conversation) => {
              const partner = conversation.participants.find(
                (participant) => participant.userId !== currentUserId,
              );
              const title = partner?.companyName ?? partner?.fullName ?? 'Kullanıcı';
              const preview = conversation.lastMessage?.body
                ?? conversation.productName
                ?? 'Yeni konuşma';
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type='button'
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={[
                    'flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition',
                    isActive ? 'bg-slate-100' : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600'>
                    {title.slice(0, 2).toLocaleUpperCase('tr-TR')}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-bold text-slate-900'>{title}</p>
                    <p className='mt-1 line-clamp-2 text-xs leading-snug text-slate-500'>{preview}</p>
                  </div>
                </button>
              );
            })}

            {!conversationsQuery.isLoading && conversations.length === 0 ? (
              <p className='p-4 text-sm text-slate-500'>Henüz mesajlaşma yok.</p>
            ) : null}
          </div>
        </aside>
      </div>

      <QuoteOfferModal
        open={isQuoteModalOpen}
        defaultProductListingId={conversationQuery.data?.productListingId ?? null}
        onClose={() => setIsQuoteModalOpen(false)}
        onSubmit={async (payload) => {
          if (!socket) {
            throw new Error('Socket bağlantısı yok.');
          }

          socket.emit('send_quote_offer', {
            conversationId: activeConversationId,
            quoteData: payload,
          });
        }}
      />
    </div>
  );
}
