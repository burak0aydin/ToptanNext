'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  type ChatMessage,
  type ConversationMessagesResponse,
} from '@/features/chat/api/chat.api';
import { getUserRoleFromToken } from '@/lib/auth-token';
import { getCurrentUserIdFromToken } from '@/features/chat/utils/auth';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { CounterOfferModal } from './CounterOfferModal';

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
  const [isBuyer, setIsBuyer] = useState(false);

  const setMessages = useChatStore((state) => state.setMessages);
  const messagesMap = useChatStore((state) => state.messages);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const markConversationRead = useChatStore((state) => state.markConversationRead);
  const typingUsersMap = useChatStore((state) => state.typingUsers);

  const [counterQuoteId, setCounterQuoteId] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const hasInitialScrollRef = useRef(false);

  useEffect(() => {
    setIsBuyer(getUserRoleFromToken() === 'BUYER');
  }, []);

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
        currency: string;
        notes?: string;
        expiresInHours: number;
      };
    }) => createCounterOffer(input.quoteId, input.payload),
  });

  useEffect(() => {
    setActiveConversation(conversationId);

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

  useEffect(() => {
    if (hasInitialScrollRef.current || threadItems.length === 0) {
      return;
    }

    rowVirtualizer.scrollToIndex(threadItems.length - 1, {
      align: 'end',
    });

    hasInitialScrollRef.current = true;
  }, [rowVirtualizer, threadItems.length]);

  useEffect(() => {
    const element = parentRef.current;

    if (!element) {
      return;
    }

    const onScroll = () => {
      if (
        element.scrollTop < 120
        && messagesQuery.hasNextPage
        && !messagesQuery.isFetchingNextPage
      ) {
        void messagesQuery.fetchNextPage();
      }
    };

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

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {showHeader ? (
        <div className='border-b border-slate-200 px-4 py-3'>
          <h3 className='text-lg font-bold text-slate-800'>
            {conversationQuery.data?.productName ?? 'Konuşma'}
          </h3>
        </div>
      ) : null}

      <div ref={parentRef} className='min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4'>
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
                  isBuyer={isBuyer}
                  onAcceptQuote={async (quoteId) => {
                    await acceptMutation.mutateAsync(quoteId);
                  }}
                  onRejectQuote={async (quoteId) => {
                    await rejectMutation.mutateAsync(quoteId);
                  }}
                  onCounterQuote={(quoteId) => {
                    setCounterQuoteId(quoteId);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <TypingIndicator count={typingCount} />

      <CounterOfferModal
        open={Boolean(counterQuoteId)}
        onClose={() => setCounterQuoteId(null)}
        onSubmit={async (payload) => {
          if (!counterQuoteId) {
            return;
          }

          await counterMutation.mutateAsync({
            quoteId: counterQuoteId,
            payload: {
              quantity: payload.quantity,
              unitPrice: payload.unitPrice,
              currency: payload.currency ?? 'TRY',
              notes: payload.notes,
              expiresInHours: payload.expiresInHours ?? 24,
            },
          });
          setCounterQuoteId(null);
        }}
      />
    </div>
  );
}
