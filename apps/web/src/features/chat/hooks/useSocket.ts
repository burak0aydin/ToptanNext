'use client';

import { useEffect, useMemo } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth-token';
import { useChatStore } from '../store/useChatStore';
import type { ChatMessage, QuoteStatus } from '../api/chat.api';

let socketInstance: Socket | null = null;
let listenersBound = false;

function resolveSocketUrl(): string {
  const explicitSocketUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitSocketUrl && explicitSocketUrl.trim().length > 0) {
    return explicitSocketUrl;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  try {
    const parsed = new URL(apiBase);
    return parsed.origin;
  } catch {
    return 'http://localhost:3001';
  }
}

function bindListeners(socket: Socket): void {
  if (listenersBound) {
    return;
  }

  listenersBound = true;

  socket.on('connect', () => {
    useChatStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    useChatStore.getState().setConnected(false);
  });

  socket.on('new_message', (message: ChatMessage) => {
    useChatStore.getState().addMessage(message.conversationId, message);
  });

  socket.on(
    'quote_status_updated',
    (payload: {
      quoteId: string;
      status: QuoteStatus;
      updatedAt: string;
      conversationId?: string;
    }) => {
      const conversationId = payload.conversationId ?? useChatStore.getState().activeConversationId;
      if (!conversationId) {
        return;
      }

      useChatStore
        .getState()
        .updateQuoteStatus(conversationId, payload.quoteId, payload.status, payload.updatedAt);
    },
  );

  socket.on(
    'user_typing',
    (payload: { userId: string; conversationId: string }) => {
      useChatStore.getState().setTypingUser(payload.conversationId, payload.userId);
    },
  );

  socket.on(
    'user_stopped_typing',
    (payload: { userId: string; conversationId: string }) => {
      useChatStore.getState().clearTypingUser(payload.conversationId, payload.userId);
    },
  );

  socket.on(
    'messages_read',
    (payload: { conversationId: string; userId: string; lastReadAt: string }) => {
      useChatStore.getState().markConversationRead(payload.conversationId);
    },
  );

  socket.on(
    'unread_count_updated',
    (payload: { conversationId: string; count: number }) => {
      useChatStore
        .getState()
        .updateUnreadCount(payload.conversationId, payload.count);
    },
  );
}

export function useSocket() {
  const isConnected = useChatStore((state) => state.isConnected);

  const socket = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!socketInstance) {
      socketInstance = io(resolveSocketUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 8_000,
        auth: {
          token: getAccessToken(),
        },
      });

      bindListeners(socketInstance);
    }

    return socketInstance;
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.auth = {
      token: getAccessToken(),
    };

    if (!socket.connected) {
      socket.connect();
    }
  }, [socket]);

  return {
    socket,
    isConnected,
  };
}
