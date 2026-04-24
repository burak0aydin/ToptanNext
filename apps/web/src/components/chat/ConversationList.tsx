'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchConversations } from '@/features/chat/api/chat.api';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { getCurrentUserIdFromToken } from '@/features/chat/utils/auth';
import { ConversationItem } from './ConversationItem';

const FILTERS: Array<{ key: 'all' | 'pending_quotes' | 'unread'; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending_quotes', label: 'Teklif Bekleyenler' },
  { key: 'unread', label: 'Okunmayanlar' },
];

export function ConversationList() {
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
      router.replace(`/messages${nextQueryString.length > 0 ? `?${nextQueryString}` : ''}`);
    }
  }, [debouncedSearch, router, searchParams]);

  const { isLoading, isError, data } = useQuery({
    queryKey: ['chat', 'conversations', activeFilter, debouncedSearch],
    queryFn: () =>
      fetchConversations({
        filter: activeFilter,
        search: debouncedSearch,
      }),
  });

  useEffect(() => {
    if (data) {
      setConversations(data);
    }
  }, [data, setConversations]);

  const currentUserId = useMemo(() => getCurrentUserIdFromToken(), []);

  const conversations = useMemo(
    () =>
      Array.from(conversationMap.values()).sort(
        (left, right) =>
          new Date(right.lastMessageAt).getTime() -
          new Date(left.lastMessageAt).getTime(),
      ),
    [conversationMap],
  );

  const handleFilterChange = (value: 'all' | 'pending_quotes' | 'unread') => {
    const nextQuery = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      nextQuery.delete('filter');
    } else {
      nextQuery.set('filter', value);
    }

    router.replace(`/messages${nextQuery.toString().length > 0 ? `?${nextQuery.toString()}` : ''}`);
  };

  return (
    <aside className='flex h-full min-h-0 flex-col border-r border-slate-200 bg-white'>
      <div className='border-b border-slate-100 p-4'>
        <h2 className='text-2xl font-bold text-slate-800'>Mesajlar</h2>

        <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className='w-full border-none bg-transparent text-sm text-slate-700 outline-none'
            placeholder='Kişilerde ara...'
          />
        </div>

        <div className='mt-3 flex flex-wrap gap-2'>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type='button'
                onClick={() => handleFilterChange(filter.key)}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
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
      </div>

      {isLoading ? (
        <div className='p-4 text-sm text-slate-500'>Konuşmalar yükleniyor...</div>
      ) : null}

      {isError ? (
        <div className='p-4 text-sm text-red-600'>Konuşmalar yüklenirken bir hata oluştu.</div>
      ) : null}

      <div className='flex-1 space-y-2 overflow-y-auto p-3'>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            currentUserId={currentUserId}
            isActive={pathname === `/messages/${conversation.id}`}
          />
        ))}

        {!isLoading && conversations.length === 0 ? (
          <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500'>
            Bu filtrede konuşma bulunamadı.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
