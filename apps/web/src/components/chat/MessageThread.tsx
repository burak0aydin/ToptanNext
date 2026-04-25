'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  acceptQuote,
  createCounterOffer,
  fetchConversationById,
  fetchConversationMessages,
  rejectQuote,
  type ChatQuote,
  type ChatMessage,
  type ConversationMessagesResponse,
} from '@/features/chat/api/chat.api';
import { getCurrentUserIdFromToken } from '@/features/chat/utils/auth';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { resolveProductListingMediaUrl } from '@/features/product-listing/api/product-listing.api';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuoteOfferModal } from './QuoteOfferModal';

type MessageThreadProps = {
  conversationId: string;
  showHeader?: boolean;
};

type ThreadItem =
  | { type: 'separator'; key: string; label: string }
  | { type: 'message'; key: string; message: ChatMessage };

function formatDateSeparator(date: Date): string {
  if (isToday(date)) {
    return 'BUGÜN';
  }

  if (isYesterday(date)) {
    return 'DÜN';
  }

  return format(date, 'dd MMMM yyyy', { locale: tr }).toUpperCase();
}

export function MessageThread({ conversationId, showHeader = true }: MessageThreadProps) {
  const { socket } = useSocket();
  const currentUserId = useMemo(() => getCurrentUserIdFromToken(), []);

  const setMessages = useChatStore((state) => state.setMessages);
  const messagesMap = useChatStore((state) => state.messages);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const markConversationRead = useChatStore((state) => state.markConversationRead);
  const typingUsersMap = useChatStore((state) => state.typingUsers);

  const [counterQuote, setCounterQuote] = useState<ChatQuote | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const hasInitialScrollRef = useRef(false);
  const lastAutoScrolledMessageIdRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);

  const conversationQuery = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => fetchConversationById(conversationId),
  });

  const messagesQuery = useInfiniteQuery<
    ConversationMessagesResponse,
    Error,
    InfiniteData<ConversationMessagesResponse, string | undefined>,
    [string, string, string],
    string | undefined
  >({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: ({ pageParam }) =>
      fetchConversationMessages(conversationId, {
        cursor: pageParam,
        limit: 50,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const acceptMutation = useMutation({
    mutationFn: (quoteId: string) => acceptQuote(quoteId),
  });

  const rejectMutation = useMutation({
    mutationFn: (quoteId: string) => rejectQuote(quoteId),
  });

  const counterMutation = useMutation({
    mutationFn: (input: {
      quoteId: string;
      payload: {
        quantity: number;
        unitPrice: number;
        logisticsFee?: number;
        currency: string;
        notes?: string;
        expiresInHours: number;
      };
    }) => createCounterOffer(input.quoteId, input.payload),
  });

  useEffect(() => {
    setActiveConversation(conversationId);
    hasInitialScrollRef.current = false;
    lastAutoScrolledMessageIdRef.current = null;
    isNearBottomRef.current = true;
    setNewMessageCount(0);

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (!messagesQuery.data) {
      return;
    }

    const allMessages = messagesQuery.data.pages
      .flatMap((page) => page.items)
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );

    const deduped = Array.from(
      new Map(allMessages.map((message) => [message.id, message])).values(),
    );

    setMessages(conversationId, deduped);
  }, [conversationId, messagesQuery.data, setMessages]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit('join_conversation', { conversationId });

    return () => {
      socket.emit('leave_conversation', { conversationId });
    };
  }, [conversationId, socket]);

  const messages = messagesMap.get(conversationId) ?? [];

  useEffect(() => {
    if (!socket || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    socket.emit('mark_as_read', {
      conversationId,
      lastMessageId: lastMessage.id,
    });
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead, messages, socket]);

  const threadItems = useMemo<ThreadItem[]>(() => {
    const items: ThreadItem[] = [];
    let previousDateKey: string | null = null;

    messages.forEach((message) => {
      const date = new Date(message.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (dateKey !== previousDateKey) {
        previousDateKey = dateKey;
        items.push({
          type: 'separator',
          key: `separator-${dateKey}`,
          label: formatDateSeparator(date),
        });
      }

      items.push({
        type: 'message',
        key: message.id,
        message,
      });
    });

    return items;
  }, [messages]);

  const rowVirtualizer = useVirtualizer({
    count: threadItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      threadItems[index]?.type === 'separator' ? 44 : 180,
    getItemKey: (index) => threadItems[index]?.key ?? index,
    overscan: 10,
  });

  const scrollToLatestMessage = useCallback(() => {
    if (threadItems.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(threadItems.length - 1, {
        align: 'end',
      });

      window.requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(threadItems.length - 1, {
          align: 'end',
        });
      });
    });
  }, [rowVirtualizer, threadItems.length]);

  useEffect(() => {
    if (hasInitialScrollRef.current || threadItems.length === 0) {
      return;
    }

    scrollToLatestMessage();
    lastAutoScrolledMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
    hasInitialScrollRef.current = true;
  }, [messages, scrollToLatestMessage, threadItems.length]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || threadItems.length === 0) {
      return;
    }

    if (lastAutoScrolledMessageIdRef.current === lastMessage.id) {
      return;
    }

    lastAutoScrolledMessageIdRef.current = lastMessage.id;

    if (isNearBottomRef.current || lastMessage.senderId === currentUserId) {
      setNewMessageCount(0);
      scrollToLatestMessage();
      return;
    }

    setNewMessageCount((current) => current + 1);
  }, [currentUserId, messages, scrollToLatestMessage, threadItems.length]);

  useEffect(() => {
    const element = parentRef.current;

    if (!element) {
      return;
    }

    const updateNearBottom = () => {
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      const isNearBottom = distanceFromBottom < 120;
      isNearBottomRef.current = isNearBottom;

      if (isNearBottom) {
        setNewMessageCount(0);
      }
    };

    const onScroll = () => {
      updateNearBottom();

      if (
        element.scrollTop < 120
        && messagesQuery.hasNextPage
        && !messagesQuery.isFetchingNextPage
      ) {
        void messagesQuery.fetchNextPage();
      }
    };

    updateNearBottom();
    element.addEventListener('scroll', onScroll);

    return () => {
      element.removeEventListener('scroll', onScroll);
    };
  }, [messagesQuery]);

  const participants = conversationQuery.data?.participants ?? [];
  const partnerById = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.userId, participant]),
      ),
    [participants],
  );

  const typingCount = (() => {
    const set = typingUsersMap.get(conversationId);
    if (!set) {
      return 0;
    }

    return Array.from(set).filter((userId) => userId !== currentUserId).length;
  })();

  const productHref = conversationQuery.data?.productListingId
    ? `/urun/${conversationQuery.data.productListingId}`
    : null;
  const productImageUrl = conversationQuery.data?.productImageMediaId
    ? resolveProductListingMediaUrl(conversationQuery.data.productImageMediaId)
    : null;

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {showHeader ? (
        <div className='border-b border-slate-200 px-4 py-2'>
          {productHref ? (
            <Link
              href={productHref}
              className='inline-flex max-w-full items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-slate-50'
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
                <span className='block truncate text-sm font-bold leading-tight text-slate-800'>
                  {conversationQuery.data?.productName ?? 'Ürün'}
                </span>
                <span className='block text-[11px] font-medium text-slate-400'>Ürünü görüntüle</span>
              </span>
            </Link>
          ) : (
            <h3 className='text-sm font-bold text-slate-800'>Konuşma</h3>
          )}
        </div>
      ) : null}

      <div className='relative min-h-0 flex-1'>
        <div ref={parentRef} className='h-full overflow-y-auto bg-slate-50 px-4 py-4'>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = threadItems[virtualRow.index];
              if (!item) {
                return null;
              }

              if (item.type === 'separator') {
                return (
                  <div
                    key={item.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className='flex justify-center py-2'
                  >
                    <span className='rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-400 shadow-sm'>
                      {item.label}
                    </span>
                  </div>
                );
              }

              const message = item.message;
              const previousItem = threadItems[virtualRow.index - 1];
              const previousMessage = previousItem?.type === 'message' ? previousItem.message : null;
              const showAvatar =
                !previousMessage || previousMessage.senderId !== message.senderId;

              const sender = partnerById.get(message.senderId);

              return (
                <div
                  key={item.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className='py-1.5'
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    showAvatar={showAvatar}
                    avatarUrl={sender?.avatarUrl}
                    senderName={sender?.companyName || sender?.fullName}
                    onAcceptQuote={async (quoteId) => {
                      await acceptMutation.mutateAsync(quoteId);
                    }}
                    onRejectQuote={async (quoteId) => {
                      await rejectMutation.mutateAsync(quoteId);
                    }}
                  onCounterQuote={(quoteId) => {
                      setCounterQuote(quoteId);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {newMessageCount > 0 ? (
          <button
            type='button'
            className='absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-container'
            onClick={() => {
              setNewMessageCount(0);
              isNearBottomRef.current = true;
              scrollToLatestMessage();
            }}
          >
            {newMessageCount} yeni mesajınız var
          </button>
        ) : null}
      </div>

      <TypingIndicator count={typingCount} />

      <QuoteOfferModal
        open={Boolean(counterQuote)}
        title='Karşı Teklif Gönder'
        submitLabel='Karşı Teklif Gönder'
        defaultProductListingId={counterQuote?.productListingId ?? null}
        initialValues={counterQuote ? {
          quantity: counterQuote.quantity,
          unitPrice: counterQuote.unitPrice,
          logisticsFee: counterQuote.logisticsFee ?? undefined,
          currency: counterQuote.currency,
          notes: counterQuote.notes ?? '',
          expiresInHours: 24,
        } : undefined}
        onClose={() => setCounterQuote(null)}
        onSubmit={async (payload) => {
          if (!counterQuote) {
            return;
          }

          await counterMutation.mutateAsync({
            quoteId: counterQuote.id,
            payload: {
              quantity: payload.quantity,
              unitPrice: payload.unitPrice,
              logisticsFee: payload.logisticsFee,
              currency: payload.currency ?? 'TRY',
              notes: payload.notes,
              expiresInHours: payload.expiresInHours ?? 24,
            },
          });
          setCounterQuote(null);
        }}
      />
    </div>
  );
}
