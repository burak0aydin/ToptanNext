import { BadRequestException } from '@nestjs/common';
import { MessageType, Prisma, QuoteStatus, Role } from '@prisma/client';
import { QuotesService } from './quotes.service';

function createBaseQuote() {
  return {
    id: 'quote-1',
    status: QuoteStatus.PENDING,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    message: {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'supplier-1',
      conversation: {
        id: 'conv-1',
        productListingId: 'prd-1',
        participants: [{ userId: 'buyer-1' }, { userId: 'supplier-1' }],
      },
    },
  };
}

describe('QuotesService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    quote: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const redisMock = {
    set: jest.fn(),
  };

  const notificationsMock = {
    queueQuoteAccepted: jest.fn(),
    queueQuoteReceived: jest.fn(),
    queueQuoteExpired: jest.fn(),
  };

  const realtimeMock = {
    emitToConversation: jest.fn(),
    emitToUser: jest.fn(),
  };

  let service: QuotesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuotesService(
      prismaMock as never,
      redisMock as never,
      notificationsMock as never,
      realtimeMock as never,
    );
  });

  it('acceptQuote should accept pending quote and expire others in transaction', async () => {
    const baseQuote = createBaseQuote();

    prismaMock.user.findUnique.mockResolvedValue({ role: Role.BUYER });
    prismaMock.quote.findUnique.mockResolvedValue(baseQuote);

    const tx = {
      quote: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({
          id: baseQuote.id,
          status: QuoteStatus.ACCEPTED,
          updatedAt: new Date('2026-04-24T10:00:00.000Z'),
        }),
      },
      message: {
        create: jest.fn().mockResolvedValue({ createdAt: new Date('2026-04-24T10:00:00.000Z') }),
      },
      conversation: {
        update: jest.fn().mockResolvedValue({}),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'buyer-1', unreadCount: 0 },
          { userId: 'supplier-1', unreadCount: 2 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.acceptQuote('quote-1', 'buyer-1');

    expect(tx.quote.updateMany).toHaveBeenCalled();
    expect(tx.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'quote-1' },
        data: { status: QuoteStatus.ACCEPTED },
      }),
    );
    expect(realtimeMock.emitToConversation).toHaveBeenCalledWith(
      'conv-1',
      'quote_status_updated',
      expect.objectContaining({
        conversationId: 'conv-1',
        quoteId: 'quote-1',
        status: QuoteStatus.ACCEPTED,
      }),
    );
    expect(notificationsMock.queueQuoteAccepted).toHaveBeenCalledWith({
      quoteId: 'quote-1',
      conversationId: 'conv-1',
      initiatorUserId: 'buyer-1',
      recipientUserIds: ['supplier-1'],
    });
    expect(result.status).toBe(QuoteStatus.ACCEPTED);
  });

  it('acceptQuote should allow supplier to accept buyer counter offer', async () => {
    const counterQuote = {
      ...createBaseQuote(),
      id: 'quote-counter-1',
      message: {
        ...createBaseQuote().message,
        senderId: 'buyer-1',
      },
    };

    prismaMock.user.findUnique.mockResolvedValue({ id: 'supplier-1' });
    prismaMock.quote.findUnique.mockResolvedValue(counterQuote);

    const tx = {
      quote: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({
          id: counterQuote.id,
          status: QuoteStatus.ACCEPTED,
          updatedAt: new Date('2026-04-24T10:05:00.000Z'),
        }),
      },
      message: {
        create: jest.fn().mockResolvedValue({ createdAt: new Date('2026-04-24T10:05:00.000Z') }),
      },
      conversation: {
        update: jest.fn().mockResolvedValue({}),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'buyer-1', unreadCount: 1 },
          { userId: 'supplier-1', unreadCount: 0 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.acceptQuote('quote-counter-1', 'supplier-1');

    expect(tx.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        senderId: 'supplier-1',
        type: MessageType.QUOTE_ACCEPTED,
      }),
    }));
    expect(notificationsMock.queueQuoteAccepted).toHaveBeenCalledWith({
      quoteId: 'quote-counter-1',
      conversationId: 'conv-1',
      initiatorUserId: 'supplier-1',
      recipientUserIds: ['buyer-1'],
    });
    expect(result.status).toBe(QuoteStatus.ACCEPTED);
  });

  it('acceptQuote should expire and reject when quote already expired', async () => {
    const expiredQuote = {
      ...createBaseQuote(),
      expiresAt: new Date(Date.now() - 60 * 1000),
    };

    prismaMock.user.findUnique.mockResolvedValue({ role: Role.BUYER });
    prismaMock.quote.findUnique.mockResolvedValue(expiredQuote);
    prismaMock.quote.update.mockResolvedValue({});

    await expect(service.acceptQuote('quote-1', 'buyer-1')).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.quote.update).toHaveBeenCalledWith({
      where: { id: 'quote-1' },
      data: { status: QuoteStatus.EXPIRED },
    });
  });

  it('rejectQuote should mark quote rejected and broadcast status', async () => {
    const baseQuote = createBaseQuote();
    prismaMock.user.findUnique.mockResolvedValue({ role: Role.BUYER });
    prismaMock.quote.findUnique.mockResolvedValue(baseQuote);

    const tx = {
      quote: {
        update: jest.fn().mockResolvedValue({
          id: baseQuote.id,
          status: QuoteStatus.REJECTED,
          updatedAt: new Date('2026-04-24T10:10:00.000Z'),
        }),
      },
      message: {
        create: jest.fn().mockResolvedValue({ createdAt: new Date('2026-04-24T10:10:00.000Z') }),
      },
      conversation: {
        update: jest.fn().mockResolvedValue({}),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'buyer-1', unreadCount: 0 },
          { userId: 'supplier-1', unreadCount: 1 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.rejectQuote('quote-1', 'buyer-1');

    expect(result.status).toBe(QuoteStatus.REJECTED);
    expect(realtimeMock.emitToConversation).toHaveBeenCalledWith(
      'conv-1',
      'quote_status_updated',
      expect.objectContaining({
        conversationId: 'conv-1',
        status: QuoteStatus.REJECTED,
      }),
    );
  });

  it('rejectQuote should allow supplier to reject buyer counter offer', async () => {
    const counterQuote = {
      ...createBaseQuote(),
      id: 'quote-counter-1',
      message: {
        ...createBaseQuote().message,
        senderId: 'buyer-1',
      },
    };

    prismaMock.user.findUnique.mockResolvedValue({ id: 'supplier-1' });
    prismaMock.quote.findUnique.mockResolvedValue(counterQuote);

    const tx = {
      quote: {
        update: jest.fn().mockResolvedValue({
          id: counterQuote.id,
          status: QuoteStatus.REJECTED,
          updatedAt: new Date('2026-04-24T10:15:00.000Z'),
        }),
      },
      message: {
        create: jest.fn().mockResolvedValue({ createdAt: new Date('2026-04-24T10:15:00.000Z') }),
      },
      conversation: {
        update: jest.fn().mockResolvedValue({}),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'buyer-1', unreadCount: 1 },
          { userId: 'supplier-1', unreadCount: 0 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.rejectQuote('quote-counter-1', 'supplier-1');

    expect(tx.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        senderId: 'supplier-1',
        type: MessageType.QUOTE_REJECTED,
      }),
    }));
    expect(result.status).toBe(QuoteStatus.REJECTED);
  });

  it('createCounterOffer should mark original as countered and create counter message', async () => {
    const baseQuote = createBaseQuote();
    prismaMock.quote.findUnique.mockResolvedValue(baseQuote);

    const tx = {
      quote: {
        update: jest.fn().mockResolvedValue({ id: 'quote-1' }),
      },
      message: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-counter-1',
          conversationId: 'conv-1',
          senderId: 'buyer-1',
          type: MessageType.COUNTER_OFFER,
          body: 'Karşı teklif',
          isEdited: false,
          deletedAt: null,
          createdAt: new Date('2026-04-24T10:20:00.000Z'),
          attachments: [],
          quote: {
            id: 'quote-counter-1',
            productListingId: 'prd-1',
            quantity: 75,
            unitPrice: new Prisma.Decimal(900),
            currency: 'TRY',
            notes: 'Karşı teklif',
            status: QuoteStatus.PENDING,
            expiresAt: new Date('2026-04-25T10:20:00.000Z'),
            counterQuoteId: 'quote-1',
            createdAt: new Date('2026-04-24T10:20:00.000Z'),
            updatedAt: new Date('2026-04-24T10:20:00.000Z'),
          },
        }),
      },
      conversation: {
        update: jest.fn().mockResolvedValue({}),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'buyer-1', unreadCount: 0 },
          { userId: 'supplier-1', unreadCount: 3 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.createCounterOffer('quote-1', 'buyer-1', {
      productListingId: 'prd-1',
      quantity: 75,
      unitPrice: 900,
      currency: 'TRY',
      notes: 'Karşı teklif',
      expiresInHours: 24,
    });

    expect(tx.quote.update).toHaveBeenCalledWith({
      where: { id: 'quote-1' },
      data: { status: QuoteStatus.COUNTERED },
    });
    expect(result.originalQuoteId).toBe('quote-1');
    expect(result.message.type).toBe(MessageType.COUNTER_OFFER);
    expect(notificationsMock.queueQuoteReceived).toHaveBeenCalled();
  });

  it('createQuoteOffer should cancel pending quotes before creating replacement offer', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: Role.SUPPLIER });

    const tx = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          productListingId: 'prd-1',
          participants: [{ userId: 'buyer-1' }, { userId: 'supplier-1' }],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      quote: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'quote-old-1' },
          { id: 'quote-counter-1' },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      message: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-new-offer',
          conversationId: 'conv-1',
          senderId: 'supplier-1',
          type: MessageType.QUOTE_OFFER,
          body: null,
          isEdited: false,
          deletedAt: null,
          createdAt: new Date('2026-04-24T11:00:00.000Z'),
          attachments: [],
          quote: {
            id: 'quote-new-1',
            productListingId: 'prd-1',
            quantity: 10,
            unitPrice: new Prisma.Decimal(100),
            logisticsFee: null,
            currency: 'TRY',
            notes: null,
            status: QuoteStatus.PENDING,
            expiresAt: new Date('2026-04-25T11:00:00.000Z'),
            counterQuoteId: null,
            createdAt: new Date('2026-04-24T11:00:00.000Z'),
            updatedAt: new Date('2026-04-24T11:00:00.000Z'),
          },
        }),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'buyer-1', unreadCount: 1 },
          { userId: 'supplier-1', unreadCount: 0 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.createQuoteOffer('conv-1', 'supplier-1', {
      productListingId: 'prd-1',
      quantity: 10,
      unitPrice: 100,
      currency: 'TRY',
      expiresInHours: 24,
    });

    expect(tx.quote.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['quote-old-1', 'quote-counter-1'],
        },
      },
      data: {
        status: QuoteStatus.CANCELED,
      },
    });
    expect(result.canceledQuoteIds).toEqual(['quote-old-1', 'quote-counter-1']);
    expect(result.message.quote?.id).toBe('quote-new-1');
    expect(realtimeMock.emitToConversation).toHaveBeenCalledWith(
      'conv-1',
      'quote_status_updated',
      expect.objectContaining({
        quoteId: 'quote-old-1',
        status: QuoteStatus.CANCELED,
      }),
    );
  });

  it('expirePendingQuotes should expire due quotes and enqueue notifications', async () => {
    prismaMock.quote.findMany.mockResolvedValue([
      {
        id: 'quote-expired-1',
        message: {
          conversationId: 'conv-1',
          senderId: 'supplier-1',
          conversation: {
            participants: [{ userId: 'supplier-1' }, { userId: 'buyer-1' }],
          },
        },
      },
    ]);
    prismaMock.quote.updateMany.mockResolvedValue({ count: 1 });

    await service.expirePendingQuotes();

    expect(prismaMock.quote.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['quote-expired-1'],
        },
      },
      data: {
        status: QuoteStatus.EXPIRED,
      },
    });
    expect(realtimeMock.emitToConversation).toHaveBeenCalledWith(
      'conv-1',
      'quote_status_updated',
      expect.objectContaining({
        quoteId: 'quote-expired-1',
        status: QuoteStatus.EXPIRED,
      }),
    );
    expect(notificationsMock.queueQuoteExpired).toHaveBeenCalledWith({
      quoteId: 'quote-expired-1',
      conversationId: 'conv-1',
      initiatorUserId: 'supplier-1',
      recipientUserIds: ['supplier-1', 'buyer-1'],
    });
  });
});
