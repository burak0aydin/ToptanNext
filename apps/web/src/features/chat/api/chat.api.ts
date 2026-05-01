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
  | 'COUNTER_OFFER'
  | 'LOGISTICS_REQUEST'
  | 'LOGISTICS_OFFER';

export type QuoteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTERED'
  | 'EXPIRED'
  | 'CANCELED';

export type LogisticsRequestStatus =
  | 'PENDING'
  | 'COLLECTING'
  | 'CLOSED'
  | 'CANCELED'
  | 'OFFERED'
  | 'APPROVED'
  | 'EXPIRED';

export type LogisticsOfferStatus =
  | 'DRAFT'
  | 'OFFERED'
  | 'SUBMITTED'
  | 'SELECTED'
  | 'REJECTED';

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
  productName: string | null;
  productImageMediaId: string | null;
  quantity: number;
  unitPrice: number;
  logisticsFee: number | null;
  currency: string;
  notes: string | null;
  status: QuoteStatus;
  expiresAt: string;
  counterQuoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LogisticsRequest = {
  id: string;
  conversationId: string;
  requesterId: string;
  fromCity: string;
  toCity: string;
  palletCount: number | null;
  itemCount: number | null;
  status: LogisticsRequestStatus;
  createdAt: string;
  updatedAt: string;
  offers: LogisticsOffer[];
  requesterCompanyName?: string | null;
  requesterName?: string | null;
  productName?: string | null;
  productImageMediaId?: string | null;
  isSellerDelivery?: boolean;
  sellerDeliveryFee?: number | null;
};

export type LogisticsOffer = {
  id: string;
  requestId: string;
  partnerId: string;
  partnerCompanyName: string | null;
  partnerAvatarUrl: string | null;
  price: number;
  currency: string;
  estimatedDays: number;
  isInsured: boolean;
  notes: string | null;
  status: LogisticsOfferStatus;
  createdAt: string;
  updatedAt: string;
};

export type PartnerLogisticsOffer = LogisticsOffer & {
  conversationId: string;
  requestStatus: LogisticsRequestStatus;
  fromCity: string;
  toCity: string;
  requesterCompanyName: string | null;
  requesterName: string | null;
  productName: string | null;
  productImageMediaId: string | null;
  isSellerDelivery: boolean;
  sellerDeliveryFee: number | null;
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
  productImageMediaId: string | null;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  participants: ConversationParticipant[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
  hasPendingQuote: boolean;
  hasPendingLogistics: boolean;
  hasApprovedLogistics: boolean;
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
  logisticsFee?: number;
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
  filter?: 'all' | 'pending_quotes' | 'unread' | 'logistics_pending';
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

export async function requestLogistics(
  conversationId: string,
  payload: {
    fromCity: string;
    toCity: string;
    palletCount?: number;
    itemCount?: number;
    notes?: string;
    // If seller wants to deliver with own vehicle
    isSellerDelivery?: boolean;
    sellerDeliveryFee?: number;
  },
): Promise<LogisticsRequest> {
  return requestJson<LogisticsRequest, typeof payload>(
    `/conversations/${conversationId}/logistics-request`,
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );
}

export async function fetchLatestLogisticsRequest(
  conversationId: string,
): Promise<LogisticsRequest | null> {
  return requestJson<LogisticsRequest | null>(
    `/conversations/${conversationId}/logistics-request`,
    { auth: true },
  );
}

export async function fetchOpenLogisticsRequests(): Promise<LogisticsRequest[]> {
  return requestJson<LogisticsRequest[]>('/logistics/requests/open', {
    auth: true,
  });
}

export async function fetchMyLogisticsOffers(): Promise<PartnerLogisticsOffer[]> {
  return requestJson<PartnerLogisticsOffer[]>('/logistics/offers/me', {
    auth: true,
  });
}

export async function createLogisticsOffer(
  requestId: string,
  payload: {
    price: number;
    currency?: string;
    estimatedDays: number;
    isInsured?: boolean;
    notes?: string;
  },
): Promise<LogisticsOffer> {
  return requestJson<LogisticsOffer, typeof payload>(
    `/logistics/requests/${requestId}/offers`,
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );
}

export async function listLogisticsOffers(
  conversationId: string,
): Promise<LogisticsOffer[]> {
  return requestJson<LogisticsOffer[]>(
    `/conversations/${conversationId}/logistics-offers`,
    { auth: true },
  );
}

export async function selectLogisticsOffer(
  conversationId: string,
  offerId: string,
): Promise<LogisticsOffer> {
  void conversationId;

  return requestJson<LogisticsOffer>(
    `/logistics/offers/${offerId}/select`,
    {
      method: 'PATCH',
      auth: true,
    },
  );
}
