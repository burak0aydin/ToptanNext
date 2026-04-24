import { create } from 'zustand';
import type { ChatMessage, ConversationSummary, QuoteStatus } from '../api/chat.api';

type ChatState = {
  conversations: Map<string, ConversationSummary>;
  activeConversationId: string | null;
  messages: Map<string, ChatMessage[]>;
  typingUsers: Map<string, Set<string>>;
  isConnected: boolean;
  setConversations: (conversations: ConversationSummary[]) => void;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  prependMessages: (conversationId: string, messages: ChatMessage[]) => void;
  updateQuoteStatus: (
    conversationId: string,
    quoteId: string,
    status: QuoteStatus,
    updatedAt: string,
  ) => void;
  setTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUser: (conversationId: string, userId: string) => void;
  markConversationRead: (conversationId: string) => void;
  updateUnreadCount: (conversationId: string, count: number) => void;
  setConnected: (connected: boolean) => void;
};

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: new Map(),
  activeConversationId: null,
  messages: new Map(),
  typingUsers: new Map(),
  isConnected: false,
  setConversations: (conversations) => {
    set((state) => {
      const next = new Map(state.conversations);
      conversations.forEach((conversation) => {
        next.set(conversation.id, conversation);
      });

      return {
        conversations: next,
      };
    });
  },
  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
  },
  addMessage: (conversationId, message) => {
    set((state) => {
      const nextMessages = new Map(state.messages);
      const current = nextMessages.get(conversationId) ?? [];
      const exists = current.some((item) => item.id === message.id);
      const merged = exists
        ? current.map((item) => (item.id === message.id ? message : item))
        : [...current, message];

      nextMessages.set(conversationId, sortMessages(merged));

      const nextConversations = new Map(state.conversations);
      const existingConversation = nextConversations.get(conversationId);
      if (existingConversation) {
        nextConversations.set(conversationId, {
          ...existingConversation,
          lastMessage: message,
          lastMessageAt: message.createdAt,
        });
      }

      return {
        messages: nextMessages,
        conversations: nextConversations,
      };
    });
  },
  setMessages: (conversationId, messages) => {
    set((state) => {
      const nextMessages = new Map(state.messages);
      nextMessages.set(conversationId, sortMessages(messages));
      return { messages: nextMessages };
    });
  },
  prependMessages: (conversationId, incomingMessages) => {
    set((state) => {
      const nextMessages = new Map(state.messages);
      const current = nextMessages.get(conversationId) ?? [];
      const merged = [...incomingMessages, ...current];
      const deduped = Array.from(
        new Map(merged.map((message) => [message.id, message])).values(),
      );
      nextMessages.set(conversationId, sortMessages(deduped));

      return {
        messages: nextMessages,
      };
    });
  },
  updateQuoteStatus: (conversationId, quoteId, status, updatedAt) => {
    set((state) => {
      const nextMessages = new Map(state.messages);
      const current = nextMessages.get(conversationId) ?? [];

      const updated = current.map((message) => {
        if (!message.quote || message.quote.id !== quoteId) {
          return message;
        }

        return {
          ...message,
          quote: {
            ...message.quote,
            status,
            updatedAt,
          },
        };
      });

      nextMessages.set(conversationId, updated);
      return {
        messages: nextMessages,
      };
    });
  },
  setTypingUser: (conversationId, userId) => {
    set((state) => {
      const nextTypingUsers = new Map(state.typingUsers);
      const current = new Set<string>(nextTypingUsers.get(conversationId) ?? []);
      current.add(userId);
      nextTypingUsers.set(conversationId, current);

      return {
        typingUsers: nextTypingUsers,
      };
    });
  },
  clearTypingUser: (conversationId, userId) => {
    set((state) => {
      const nextTypingUsers = new Map(state.typingUsers);
      const current = new Set<string>(nextTypingUsers.get(conversationId) ?? []);
      current.delete(userId);
      nextTypingUsers.set(conversationId, current);

      return {
        typingUsers: nextTypingUsers,
      };
    });
  },
  markConversationRead: (conversationId) => {
    set((state) => {
      const nextConversations = new Map(state.conversations);
      const current = nextConversations.get(conversationId);
      if (!current) {
        return {};
      }

      nextConversations.set(conversationId, {
        ...current,
        unreadCount: 0,
      });

      return {
        conversations: nextConversations,
      };
    });
  },
  updateUnreadCount: (conversationId, count) => {
    set((state) => {
      const nextConversations = new Map(state.conversations);
      const current = nextConversations.get(conversationId);
      if (!current) {
        return {};
      }

      nextConversations.set(conversationId, {
        ...current,
        unreadCount: count,
      });

      return {
        conversations: nextConversations,
      };
    });
  },
  setConnected: (connected) => {
    set({ isConnected: connected });
  },
}));
