'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ConversationSummary } from '@/features/chat/api/chat.api';
import { fetchConversations } from '@/features/chat/api/chat.api';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { getCurrentUserIdFromToken } from '@/features/chat/utils/auth';
import { ConversationItem } from './ConversationItem';

const FILTERS: Array<{ key: 'all' | 'pending_quotes' | 'unread'; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'unread', label: 'Okunmayanlar' },
  { key: 'pending_quotes', label: 'Teklif Bekleyenler' },
];

type ConversationListProps = {
  basePath?: string;
  compact?: boolean;
};

export function ConversationList({ basePath = '/messages', compact = false }: ConversationListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setConversations = useChatStore((state) => state.setConversations);
  const conversationMap = useChatStore((state) => state.conversations);

  const activeFilter =
    (searchParams.get('filter') as 'all' | 'pending_quotes' | 'unread' | null)
    ?? 'all';
  const searchQueryFromUrl = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(searchQueryFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQueryFromUrl);

  useEffect(() => {
    setSearchInput(searchQueryFromUrl);
    setDebouncedSearch(searchQueryFromUrl);
  }, [searchQueryFromUrl]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  useEffect(() => {
    const nextQuery = new URLSearchParams(searchParams.toString());

    if (debouncedSearch.length > 0) {
      nextQuery.set('q', debouncedSearch);
    } else {
      nextQuery.delete('q');
    }

    const nextQueryString = nextQuery.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString !== currentQueryString) {
      router.replace(`${basePath}${nextQueryString.length > 0 ? `?${nextQueryString}` : ''}`);
    }
  }, [basePath, debouncedSearch, router, searchParams]);

  const { isLoading, isError, data } = useQuery({
    queryKey: ['chat', 'conversations', activeFilter],
    queryFn: () =>
      fetchConversations({
        filter: activeFilter,
      }),
  });

  useEffect(() => {
    if (data) {
      setConversations(data);
    }
  }, [data, setConversations]);

  const currentUserId = useMemo(() => getCurrentUserIdFromToken(), []);

  const normalizedSearch = debouncedSearch.toLowerCase();

  const conversations = useMemo(
    () => {
      const matchesSearch = (conversation: ConversationSummary) => {
        if (!normalizedSearch) {
          return true;
        }

        const haystack = [
          conversation.productName,
          conversation.lastMessage?.body,
          conversation.logisticsFromCity,
          conversation.logisticsToCity,
          ...conversation.participants.flatMap((participant) => [
            participant.companyName,
            participant.fullName,
            participant.email,
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      };

      return Array.from(conversationMap.values())
        .filter((conversation) =>
          activeFilter === 'all'
            ? true
            : activeFilter === 'unread'
              ? conversation.unreadCount > 0
              : conversation.hasPendingQuote,
        )
        .filter(matchesSearch)
        .sort(
          (left, right) =>
            new Date(right.lastMessageAt).getTime() -
            new Date(left.lastMessageAt).getTime(),
        );
    },
    [activeFilter, conversationMap, normalizedSearch],
  );

  const handleFilterChange = (value: 'all' | 'pending_quotes' | 'unread') => {
    const nextQuery = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      nextQuery.delete('filter');
    } else {
      nextQuery.set('filter', value);
    }

    router.replace(`${basePath}${nextQuery.toString().length > 0 ? `?${nextQuery.toString()}` : ''}`);
  };

  return (
    <aside className='flex h-full min-h-0 flex-col overflow-hidden bg-white md:border-r md:border-slate-200'>
      <div className={[
        'sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur',
        compact ? 'px-2 py-2' : 'px-3 py-3 md:px-4 md:py-4',
      ].join(' ')}>
        

        {!compact ? (
          <div className='mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:mt-3 md:rounded-xl md:px-3 md:py-2.5'>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className='w-full border-none bg-transparent text-[12px] font-medium text-slate-700 outline-none placeholder:text-slate-400 md:text-sm'
            placeholder='Kişilerde ara...'
          />
          </div>
        ) : null}

        {!compact ? (
          <div className='-mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1 md:mx-0 md:mt-3 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 md:gap-2'>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type='button'
                onClick={() => handleFilterChange(filter.key)}
                className={[
                  'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors md:px-3 md:text-xs',
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {filter.label}
              </button>
            );
          })}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className='p-4 text-sm text-slate-500'>Konuşmalar yükleniyor...</div>
      ) : null}

      {isError ? (
        <div className='p-4 text-sm text-red-600'>Konuşmalar yüklenirken bir hata oluştu.</div>
      ) : null}

      <div className={compact ? 'flex-1 space-y-2 overflow-y-auto p-1.5' : 'flex-1 space-y-2 overflow-y-auto px-2.5 pb-24 pt-3 md:space-y-2 md:p-3'}>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            currentUserId={currentUserId}
            isActive={pathname === `${basePath}/${conversation.id}`}
            basePath={basePath}
            compact={compact}
          />
        ))}

        {!isLoading && conversations.length === 0 ? (
          <div className={compact ? 'rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-[11px] text-slate-500' : 'rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500'}>
            {compact ? 'Yok' : 'Bu filtrede konuşma bulunamadı.'}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
