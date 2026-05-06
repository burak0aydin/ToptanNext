import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConversationList } from './ConversationList';
import { useChatStore } from '@/features/chat/store/useChatStore';
import type { ConversationSummary } from '@/features/chat/api/chat.api';

const replaceMock = jest.fn();

const searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => '/messages',
  useSearchParams: () => ({
    get: (key: string) => searchParams.get(key),
    toString: () => searchParams.toString(),
  }),
}));

const fetchConversationsMock = jest.fn();

jest.mock('@/features/chat/api/chat.api', () => ({
  fetchConversations: (...args: unknown[]) => fetchConversationsMock(...args),
}));

jest.mock('@/features/chat/utils/auth', () => ({
  getCurrentUserIdFromToken: () => 'buyer-1',
}));

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ConversationList />
    </QueryClientProvider>,
  );
}

function createConversation(overrides?: Partial<ConversationSummary>): ConversationSummary {
  return {
    id: 'conv-1',
    productListingId: 'prd-1',
    conversationType: 'PRODUCT',
    logisticsRequestId: null,
    productName: 'Ürün',
    productImageMediaId: null,
    logisticsFromCity: null,
    logisticsToCity: null,
    logisticsPalletCount: null,
    logisticsItemCount: null,
    logisticsIsSellerDelivery: false,
    logisticsSellerDeliveryFee: null,
    status: 'ACTIVE',
    lastMessageAt: new Date('2026-04-24T10:00:00.000Z').toISOString(),
    createdAt: new Date('2026-04-24T09:00:00.000Z').toISOString(),
    unreadCount: 2,
    hasPendingQuote: true,
    hasPendingLogistics: false,
    hasApprovedLogistics: false,
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'supplier-1',
      type: 'TEXT',
      body: 'Yeni teklif gönderdik',
      isEdited: false,
      deletedAt: null,
      createdAt: new Date('2026-04-24T10:00:00.000Z').toISOString(),
      attachments: [],
      quote: null,
    },
    participants: [
      {
        userId: 'buyer-1',
        fullName: 'Buyer User',
        email: 'buyer@example.com',
        companyName: 'Buyer Co',
        avatarUrl: null,
        role: 'BUYER',
        unreadCount: 0,
        lastReadAt: new Date('2026-04-24T09:00:00.000Z').toISOString(),
      },
      {
        userId: 'supplier-1',
        fullName: 'Supplier User',
        email: 'supplier@example.com',
        companyName: 'Global Industrial Ltd.',
        avatarUrl: null,
        role: 'SUPPLIER',
        unreadCount: 0,
        lastReadAt: new Date('2026-04-24T09:00:00.000Z').toISOString(),
      },
    ],
    ...overrides,
  };
}

function createSecondConversation(): ConversationSummary {
  return createConversation({
    id: 'conv-2',
    productName: 'Başka Ürün',
    lastMessageAt: new Date('2026-04-25T10:00:00.000Z').toISOString(),
    unreadCount: 0,
    hasPendingQuote: false,
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-2',
      senderId: 'supplier-2',
      type: 'TEXT',
      body: 'Farklı içerik',
      isEdited: false,
      deletedAt: null,
      createdAt: new Date('2026-04-25T10:00:00.000Z').toISOString(),
      attachments: [],
      quote: null,
    },
    participants: [
      {
        userId: 'buyer-1',
        fullName: 'Buyer User',
        email: 'buyer@example.com',
        companyName: 'Buyer Co',
        avatarUrl: null,
        role: 'BUYER',
        unreadCount: 0,
        lastReadAt: new Date('2026-04-24T09:00:00.000Z').toISOString(),
      },
      {
        userId: 'supplier-2',
        fullName: 'Another Supplier',
        email: 'another@example.com',
        companyName: 'Different Company',
        avatarUrl: null,
        role: 'SUPPLIER',
        unreadCount: 0,
        lastReadAt: new Date('2026-04-25T09:00:00.000Z').toISOString(),
      },
    ],
  });
}

describe('ConversationList', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    fetchConversationsMock.mockReset();
    searchParams.delete('filter');
    searchParams.delete('q');

    useChatStore.setState({
      conversations: new Map(),
      activeConversationId: null,
      messages: new Map(),
      typingUsers: new Map(),
      isConnected: false,
    });
  });

  it('renders conversations with unread badge', async () => {
    fetchConversationsMock.mockResolvedValue([createConversation()]);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Global Industrial Ltd.')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('TEKLİF BEKLİYOR')).toBeInTheDocument();
  });

  it('applies filter by updating URL query params', async () => {
    fetchConversationsMock.mockResolvedValue([createConversation()]);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Okunmayanlar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Okunmayanlar'));

    expect(replaceMock).toHaveBeenCalledWith('/messages?filter=unread');
  });

  it('filters the visible conversation list while searching', async () => {
    fetchConversationsMock.mockResolvedValue([createConversation(), createSecondConversation()]);

    renderWithProviders();

    const input = await screen.findByPlaceholderText('Kişilerde ara...');
    fireEvent.change(input, { target: { value: 'global' } });

    await waitFor(() => {
      expect(screen.getByText('Global Industrial Ltd.')).toBeInTheDocument();
      expect(screen.queryByText('Different Company')).not.toBeInTheDocument();
    }, {
      timeout: 1200,
    });
  });

  it('debounces search updates for 300ms before updating URL', async () => {
    fetchConversationsMock.mockResolvedValue([createConversation()]);

    renderWithProviders();

    const input = await screen.findByPlaceholderText('Kişilerde ara...');
    fireEvent.change(input, { target: { value: 'global' } });

    expect(replaceMock).not.toHaveBeenCalledWith('/messages?q=global');

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/messages?q=global');
    }, {
      timeout: 1200,
    });
  });
});
