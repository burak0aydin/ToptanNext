import { MessageType } from '@prisma/client';
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  const prismaMock = {
    conversationParticipant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const notificationsMock = {
    queueNewMessageNotification: jest.fn(),
  };

  let service: ConversationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversationsService(
      prismaMock as never,
      redisMock as never,
      notificationsMock as never,
    );
  });

  it('markAsRead should zero unread count and update cache', async () => {
    prismaMock.conversationParticipant.findUnique.mockResolvedValue({
      conversationId: 'conv-1',
      userId: 'buyer-1',
      unreadCount: 4,
      lastReadAt: new Date('2026-04-24T09:00:00.000Z'),
    });

    prismaMock.message.findFirst.mockResolvedValue({
      createdAt: new Date('2026-04-24T10:00:00.000Z'),
    });

    prismaMock.conversationParticipant.update.mockResolvedValue({
      unreadCount: 0,
      lastReadAt: new Date('2026-04-24T10:00:00.000Z'),
    });

    const result = await service.markAsRead('buyer-1', {
      conversationId: 'conv-1',
      lastMessageId: 'msg-99',
    });

    expect(prismaMock.conversationParticipant.update).toHaveBeenCalledWith({
      where: {
        conversationId_userId: {
          conversationId: 'conv-1',
          userId: 'buyer-1',
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date('2026-04-24T10:00:00.000Z'),
      },
      select: {
        unreadCount: true,
        lastReadAt: true,
      },
    });

    expect(redisMock.set).toHaveBeenCalledWith(
      'conv:conv-1:user:buyer-1:unread',
      '0',
      3600,
    );
    expect(result.unreadCount).toBe(0);
  });

  it('sendMessage should increment unread counts for recipients', async () => {
    const tx = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          participants: [
            { userId: 'supplier-1', unreadCount: 0, lastReadAt: new Date() },
            { userId: 'buyer-1', unreadCount: 0, lastReadAt: new Date() },
          ],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      message: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'supplier-1',
          type: MessageType.TEXT,
          body: 'Merhaba',
          isEdited: false,
          deletedAt: null,
          createdAt: new Date('2026-04-24T11:00:00.000Z'),
          attachments: [],
          quote: null,
        }),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'supplier-1', unreadCount: 0 },
          { userId: 'buyer-1', unreadCount: 1 },
        ]),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (arg: typeof tx) => unknown) => callback(tx));

    const result = await service.sendMessage('supplier-1', {
      conversationId: 'conv-1',
      type: MessageType.TEXT,
      body: 'Merhaba',
      attachments: [],
    });

    expect(tx.conversationParticipant.updateMany).toHaveBeenCalledWith({
      where: {
        conversationId: 'conv-1',
        userId: {
          not: 'supplier-1',
        },
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });

    expect(result.unreadByUser).toEqual([
      { userId: 'supplier-1', count: 0 },
      { userId: 'buyer-1', count: 1 },
    ]);
    expect(notificationsMock.queueNewMessageNotification).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      senderId: 'supplier-1',
      recipientUserIds: ['buyer-1'],
      preview: 'Merhaba',
    });
  });
});
