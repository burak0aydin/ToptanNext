import { requestJson } from '@/lib/api';

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'FILE'
  | 'QUOTE_REQUEST'
  | 'QUOTE_OFFER'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'COUNTER_OFFER';

export type QuoteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTERED'
  | 'EXPIRED';

export type ChatAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
};

export type ChatQuote = {
  id: string;
  productListingId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  notes: string | null;
  status: QuoteStatus;
  expiresAt: string;
  counterQuoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body: string | null;
  isEdited: boolean;
  deletedAt: string | null;
  createdAt: string;
  attachments: ChatAttachment[];
  quote: ChatQuote | null;
};

export type ConversationParticipant = {
  userId: string;
  fullName: string | null;
  email: string;
  companyName: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'SUPPLIER' | 'BUYER';
  unreadCount: number;
  lastReadAt: string;
};

export type ConversationSummary = {
  id: string;
  productListingId: string | null;
  productName: string | null;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  participants: ConversationParticipant[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
  hasPendingQuote: boolean;
};

export type ConversationMessagesResponse = {
  items: ChatMessage[];
  nextCursor: string | null;
};

export type SendMessagePayload = {
  conversationId: string;
  type: MessageType;
  body?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
};

export type CreateQuotePayload = {
  productListingId?: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  notes?: string;
  expiresInHours?: number;
};

export type UploadPresignedUrlResponse = {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
  expiresIn: number;
};

export async function fetchConversations(params?: {
  filter?: 'all' | 'pending_quotes' | 'unread';
  search?: string;
}): Promise<ConversationSummary[]> {
  const query = new URLSearchParams();

  if (params?.filter) {
    query.set('filter', params.filter);
  }

  if (params?.search && params.search.trim().length > 0) {
    query.set('search', params.search.trim());
  }

  const queryString = query.toString();
  return requestJson<ConversationSummary[]>(
    `/conversations${queryString.length > 0 ? `?${queryString}` : ''}`,
    { auth: true },
  );
}

export async function fetchConversationById(
  conversationId: string,
): Promise<ConversationSummary> {
  return requestJson<ConversationSummary>(`/conversations/${conversationId}`, {
    auth: true,
  });
}

export async function fetchConversationMessages(
  conversationId: string,
  options?: {
    cursor?: string;
    limit?: number;
  },
): Promise<ConversationMessagesResponse> {
  const query = new URLSearchParams();
  if (options?.cursor) {
    query.set('cursor', options.cursor);
  }
  if (options?.limit) {
    query.set('limit', String(options.limit));
  }

  return requestJson<ConversationMessagesResponse>(
    `/conversations/${conversationId}/messages${query.toString().length > 0 ? `?${query.toString()}` : ''}`,
    { auth: true },
  );
}

export async function createConversation(payload: {
  participantId: string;
  productListingId?: string;
}): Promise<ConversationSummary> {
  return requestJson<ConversationSummary, typeof payload>('/conversations', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function archiveConversation(conversationId: string): Promise<void> {
  await requestJson<{ archived: boolean }>(`/conversations/${conversationId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function fetchQuoteById(quoteId: string): Promise<ChatQuote> {
  return requestJson<ChatQuote>(`/quotes/${quoteId}`, { auth: true });
}

export async function acceptQuote(quoteId: string): Promise<{
  quoteId: string;
  status: QuoteStatus;
  updatedAt: string;
  conversationId: string;
}> {
  return requestJson(`/quotes/${quoteId}/accept`, {
    method: 'PATCH',
    auth: true,
  });
}

export async function rejectQuote(quoteId: string): Promise<{
  quoteId: string;
  status: QuoteStatus;
  updatedAt: string;
  conversationId: string;
}> {
  return requestJson(`/quotes/${quoteId}/reject`, {
    method: 'PATCH',
    auth: true,
  });
}

export async function createCounterOffer(
  quoteId: string,
  payload: CreateQuotePayload,
): Promise<{
  message: ChatMessage;
  originalQuoteId: string;
}> {
  return requestJson(`/quotes/${quoteId}/counter`, {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function getPresignedUploadUrl(input: {
  fileName: string;
  mimeType: string;
  fileSize: number;
}): Promise<UploadPresignedUrlResponse> {
  const query = new URLSearchParams({
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: String(input.fileSize),
  });

  return requestJson<UploadPresignedUrlResponse>(
    `/uploads/presigned-url?${query.toString()}`,
    {
      auth: true,
    },
  );
}

export async function uploadChatAttachment(file: File): Promise<{
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }, FormData>('/uploads/chat-attachments', {
    method: 'POST',
    auth: true,
    body: formData,
  });
}
