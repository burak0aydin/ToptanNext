import { create } from 'zustand';
import type {
  ChatMessage,
  ConversationSummary,
  QuoteStatus,
  LogisticsRequest,
  LogisticsOffer,
} from '../api/chat.api';

type ChatState = {
  conversations: Map<string, ConversationSummary>;
  activeConversationId: string | null;
  messages: Map<string, ChatMessage[]>;
  logisticsRequests: Map<string, LogisticsRequest[]>;
  logisticsOffers: Map<string, LogisticsOffer[]>;
  selectedLogisticsOffer: Map<string, LogisticsOffer | null>;
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
  setLogisticsRequests: (conversationId: string, requests: LogisticsRequest[]) => void;
  addLogisticsRequest: (conversationId: string, request: LogisticsRequest) => void;
  setLogisticsOffers: (conversationId: string, offers: LogisticsOffer[]) => void;
  addLogisticsOffer: (conversationId: string, offer: LogisticsOffer) => void;
  selectLogisticsOffer: (conversationId: string, offer: LogisticsOffer) => void;
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
  logisticsRequests: new Map(),
  logisticsOffers: new Map(),
  selectedLogisticsOffer: new Map(),
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
  setLogisticsRequests: (conversationId, requests) => {
    set((state) => {
      const nextRequests = new Map(state.logisticsRequests);
      nextRequests.set(conversationId, requests);
      return { logisticsRequests: nextRequests };
    });
  },
  addLogisticsRequest: (conversationId, request) => {
    set((state) => {
      const nextRequests = new Map(state.logisticsRequests);
      const current = nextRequests.get(conversationId) ?? [];
      const exists = current.some((item) => item.id === request.id);
      const merged = exists
        ? current.map((item) => (item.id === request.id ? request : item))
        : [...current, request];
      nextRequests.set(conversationId, merged);

      const nextConversations = new Map(state.conversations);
      const existingConversation = nextConversations.get(conversationId);
      if (existingConversation) {
        nextConversations.set(conversationId, {
          ...existingConversation,
          hasPendingLogistics: true,
        });
      }

      return {
        logisticsRequests: nextRequests,
        conversations: nextConversations,
      };
    });
  },
  setLogisticsOffers: (conversationId, offers) => {
    set((state) => {
      const nextOffers = new Map(state.logisticsOffers);
      nextOffers.set(conversationId, offers);
      return { logisticsOffers: nextOffers };
    });
  },
  addLogisticsOffer: (conversationId, offer) => {
    set((state) => {
      const nextOffers = new Map(state.logisticsOffers);
      const current = nextOffers.get(conversationId) ?? [];
      const exists = current.some((item) => item.id === offer.id);
      const merged = exists
        ? current.map((item) => (item.id === offer.id ? offer : item))
        : [...current, offer];
      nextOffers.set(conversationId, merged);
      return { logisticsOffers: nextOffers };
    });
  },
  selectLogisticsOffer: (conversationId, offer) => {
    set((state) => {
      const nextSelected = new Map(state.selectedLogisticsOffer);
      nextSelected.set(conversationId, offer);

      const nextConversations = new Map(state.conversations);
      const existingConversation = nextConversations.get(conversationId);
      if (existingConversation) {
        nextConversations.set(conversationId, {
          ...existingConversation,
          hasApprovedLogistics: true,
          hasPendingLogistics: false,
        });
      }

      return {
        selectedLogisticsOffer: nextSelected,
        conversations: nextConversations,
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
