import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useChatStore } from '@/features/chat/store/useChatStore';
import type { ConversationSummary } from '@/features/chat/api/chat.api';

type ConversationListPanelProps = {
  isLoading?: boolean;
};

/**
 * Left-side panel showing list of conversations/threads
 * Supports filtering: all, pending_quotes, unread, pending_logistics
 * Shows unread badges, pending indicators, company names
 */
export function ConversationListPanel({ isLoading = false }: ConversationListPanelProps) {
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const [filter, setFilter] = useState<'all' | 'pending_quotes' | 'unread' | 'pending_logistics'>('all');
  const [search, setSearch] = useState('');

  const filteredConversations = useMemo(() => {
    let items = Array.from(conversations.values());

    // Apply filter
    if (filter === 'pending_quotes') {
      items = items.filter((c) => c.hasPendingQuote);
    } else if (filter === 'unread') {
      items = items.filter((c) => c.unreadCount > 0);
    } else if (filter === 'pending_logistics') {
      items = items.filter((c) => c.hasPendingLogistics);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.lastMessage?.body?.toLowerCase().includes(q) ||
          c.participants.some(
            (p) =>
              p.companyName?.toLowerCase().includes(q) ||
              p.fullName?.toLowerCase().includes(q) ||
              p.email.toLowerCase().includes(q),
          ),
      );
    }

    // Sort by most recent
    return items.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  }, [conversations, filter, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter & Search Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <input
          type="text"
          placeholder="Ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50"
        />

        <div className="flex gap-2 flex-wrap">
          {(['all', 'unread', 'pending_quotes', 'pending_logistics'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' && 'Tümü'}
              {f === 'unread' && 'Okunmayan'}
              {f === 'pending_quotes' && 'Bekleyen Teklifler'}
              {f === 'pending_logistics' && 'Lojistik Bekleyen'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500">Yükleniyor...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-slate-500">Konuşma bulunamadı</div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversationId === conversation.id}
              onClick={() => setActiveConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type ConversationListItemProps = {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
};

function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const otherParticipant = conversation.participants[0];

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-left transition-all ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
            {otherParticipant?.companyName || otherParticipant?.fullName || 'İsimsiz Kullanıcı'}
          </p>
          <p className="text-xs text-slate-500 truncate">{otherParticipant?.email}</p>
        </div>

        {/* Status Badges */}
        <div className="flex gap-1">
          {conversation.hasPendingQuote && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Teklif
            </span>
          )}
          {conversation.hasPendingLogistics && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
              Lojistik
            </span>
          )}
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {Math.min(conversation.unreadCount, 9)}
            </span>
          )}
        </div>
      </div>

      {/* Last Message Preview */}
      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
        {conversation.lastMessage?.body || 'Henüz mesaj yok'}
      </p>

      {/* Timestamp */}
      <p className="text-xs text-slate-400 mt-1">
        {new Date(conversation.lastMessageAt).toLocaleDateString('tr-TR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </button>
  );
}
