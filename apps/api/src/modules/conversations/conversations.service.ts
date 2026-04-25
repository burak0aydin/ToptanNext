import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationStatus,
  MessageType,
  Prisma,
  QuoteStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { MessageAttachmentDto, SendMessageDto } from './dto/send-message.dto';

const UNREAD_CACHE_TTL_SECONDS = 60 * 60;

export type ConversationParticipantSummary = {
  userId: string;
  fullName: string | null;
  email: string;
  companyName: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'SUPPLIER' | 'BUYER';
  unreadCount: number;
  lastReadAt: Date;
};

export type QuoteRecord = {
  id: string;
  productListingId: string;
  quantity: number;
  unitPrice: number;
  logisticsFee: number | null;
  currency: string;
  productName: string | null;
  productImageMediaId: string | null;
  notes: string | null;
  status: QuoteStatus;
  expiresAt: Date;
  counterQuoteId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AttachmentRecord = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body: string | null;
  isEdited: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  attachments: AttachmentRecord[];
  quote: QuoteRecord | null;
};

export type ConversationListItem = {
  id: string;
  productListingId: string | null;
  productName: string | null;
  productImageMediaId: string | null;
  status: ConversationStatus;
  lastMessageAt: Date;
  createdAt: Date;
  participants: ConversationParticipantSummary[];
  unreadCount: number;
  lastMessage: MessageRecord | null;
  hasPendingQuote: boolean;
};

export type ConversationMessagesResult = {
  items: MessageRecord[];
  nextCursor: string | null;
};

type ConversationListFilters = {
  filter?: 'all' | 'pending_quotes' | 'unread';
  search?: string;
};

type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: {
    productListing: {
      select: {
        id: true;
        name: true;
        media: {
          where: {
            mediaType: 'IMAGE';
          };
          orderBy: {
            displayOrder: 'asc';
          };
          take: 1;
          select: {
            id: true;
          };
        };
      };
    };
    participants: {
      include: {
        user: {
          select: {
            id: true;
            fullName: true;
            email: true;
            companyName: true;
            avatarUrl: true;
            role: true;
          };
        };
      };
    };
    messages: {
      take: 1;
      orderBy: {
        createdAt: 'desc';
      };
      include: {
        attachments: true;
        quote: {
          include: {
            productListing: {
              select: {
                name: true;
                media: {
                  where: {
                    mediaType: 'IMAGE';
                  };
                  orderBy: {
                    displayOrder: 'asc';
                  };
                  take: 1;
                  select: {
                    id: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createConversation(
    requesterUserId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationListItem> {
    if (dto.participantId === requesterUserId) {
      throw new BadRequestException('Kendi kendinize konuşma başlatamazsınız.');
    }

    const [requesterUser, participantUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: requesterUserId } }),
      this.prisma.user.findUnique({ where: { id: dto.participantId } }),
    ]);

    if (!requesterUser) {
      throw new NotFoundException('Oturum sahibi kullanıcı bulunamadı.');
    }

    if (!participantUser) {
      throw new NotFoundException('Katılımcı kullanıcı bulunamadı.');
    }

    if (dto.productListingId) {
      const productListing = await this.prisma.productListing.findUnique({
        where: { id: dto.productListingId },
      });

      if (!productListing || productListing.deletedAt) {
        throw new NotFoundException('Ürün kaydı bulunamadı.');
      }
    }

    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        productListingId: dto.productListingId ?? null,
        status: ConversationStatus.ACTIVE,
        AND: [
          {
            participants: {
              some: {
                userId: requesterUserId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: dto.participantId,
              },
            },
          },
          {
            participants: {
              every: {
                userId: {
                  in: [requesterUserId, dto.participantId],
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const conversationId = existingConversation?.id
      ?? (await this.prisma.conversation.create({
        data: {
          productListingId: dto.productListingId ?? null,
          participants: {
            create: [
              {
                userId: requesterUserId,
                unreadCount: 0,
              },
              {
                userId: dto.participantId,
                unreadCount: 0,
              },
            ],
          },
        },
        select: {
          id: true,
        },
      })).id;

    return this.getConversationById(requesterUserId, conversationId);
  }

  async getConversationList(
    userId: string,
    filters: ConversationListFilters,
  ): Promise<ConversationListItem[]> {
    const normalizedSearch = filters.search?.trim();
    const andConditions: Prisma.ConversationWhereInput[] = [];

    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: {
          userId,
        },
      },
    };

    if (filters.filter === 'unread') {
      where.participants = {
        some: {
          userId,
          unreadCount: {
            gt: 0,
          },
        },
      };
    }

    if (filters.filter === 'pending_quotes') {
      where.messages = {
        some: {
          quote: {
            status: QuoteStatus.PENDING,
          },
        },
      };
    }

    if (normalizedSearch && normalizedSearch.length > 0) {
      andConditions.push({
        participants: {
          some: {
            userId: { not: userId },
            user: {
              OR: [
                { fullName: { contains: normalizedSearch, mode: 'insensitive' } },
                { companyName: { contains: normalizedSearch, mode: 'insensitive' } },
                { email: { contains: normalizedSearch, mode: 'insensitive' } },
              ],
            },
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        productListing: {
          select: {
            id: true,
            name: true,
            media: {
              where: {
                mediaType: 'IMAGE',
              },
              orderBy: {
                displayOrder: 'asc',
              },
              take: 1,
              select: {
                id: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                companyName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            attachments: true,
            quote: {
              include: {
                productListing: {
                  select: {
                    name: true,
                    media: {
                      where: {
                        mediaType: 'IMAGE',
                      },
                      orderBy: {
                        displayOrder: 'asc',
                      },
                      take: 1,
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: 200,
    });

    const conversationIds = conversations.map((conversation) => conversation.id);
    const pendingQuoteConversationIds = new Set(
      (
        await this.prisma.quote.findMany({
          where: {
            status: QuoteStatus.PENDING,
            message: {
              conversationId: {
                in: conversationIds,
              },
            },
          },
          select: {
            message: {
              select: {
                conversationId: true,
              },
            },
          },
        })
      ).map((quote) => quote.message.conversationId),
    );

    const mapped = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.getUnreadCount(
          userId,
          conversation.id,
          conversation.participants,
        );

        return this.toConversationListItem(
          conversation,
          unreadCount,
          pendingQuoteConversationIds.has(conversation.id),
        );
      }),
    );

    return mapped;
  }

  async getConversationById(
    userId: string,
    conversationId: string,
  ): Promise<ConversationListItem> {
    const conversation = await this.findConversationOrThrow(conversationId);
    this.ensureParticipant(conversation.participants, userId);

    const unreadCount = await this.getUnreadCount(
      userId,
      conversation.id,
      conversation.participants,
    );

    const hasPendingQuote = await this.prisma.quote.count({
      where: {
        status: QuoteStatus.PENDING,
        message: {
          conversationId,
        },
      },
    });

    return this.toConversationListItem(conversation, unreadCount, hasPendingQuote > 0);
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit = 50,
  ): Promise<ConversationMessagesResult> {
    await this.assertParticipant(conversationId, userId);

    const take = Math.min(Math.max(limit, 1), 50);
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: take + 1,
      ...(cursor
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {}),
      include: {
        attachments: true,
        quote: {
          include: {
            productListing: {
              select: {
                name: true,
                media: {
                  where: {
                    mediaType: 'IMAGE',
                  },
                  orderBy: {
                    displayOrder: 'asc',
                  },
                  take: 1,
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;
    const nextCursor = hasMore ? messages[take].id : null;

    return {
      items: items.reverse().map((message) => this.toMessageRecord(message)),
      nextCursor,
    };
  }

  async archiveConversation(userId: string, conversationId: string): Promise<void> {
    await this.assertParticipant(conversationId, userId);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.ARCHIVED,
      },
    });
  }

  async sendMessage(
    senderId: string,
    dto: SendMessageDto,
  ): Promise<{
    message: MessageRecord;
    unreadByUser: Array<{ userId: string; count: number }>;
    recipientUserIds: string[];
  }> {
    if (dto.type === MessageType.TEXT && (!dto.body || dto.body.trim().length === 0)) {
      throw new BadRequestException('Mesaj metni boş olamaz.');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findUnique({
        where: {
          id: dto.conversationId,
        },
        include: {
          participants: true,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Konuşma bulunamadı.');
      }

      this.ensureParticipant(conversation.participants, senderId);

      const createdMessage = await tx.message.create({
        data: {
          conversationId: dto.conversationId,
          senderId,
          type: dto.type,
          body: dto.body?.trim() ?? null,
          attachments: dto.attachments && dto.attachments.length > 0
            ? {
                create: dto.attachments.map((attachment) =>
                  this.toAttachmentCreateInput(attachment),
                ),
              }
            : undefined,
        },
        include: {
          attachments: true,
          quote: {
            include: {
              productListing: {
                select: {
                  name: true,
                  media: {
                    where: {
                      mediaType: 'IMAGE',
                    },
                    orderBy: {
                      displayOrder: 'asc',
                    },
                    take: 1,
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      await tx.conversation.update({
        where: {
          id: dto.conversationId,
        },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: dto.conversationId,
          userId: {
            not: senderId,
          },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });

      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: dto.conversationId,
            userId: senderId,
          },
        },
        data: {
          lastReadAt: createdMessage.createdAt,
        },
      });

      const participantStates = await tx.conversationParticipant.findMany({
        where: {
          conversationId: dto.conversationId,
        },
        select: {
          userId: true,
          unreadCount: true,
        },
      });

      const recipientUserIds = conversation.participants
        .map((participant) => participant.userId)
        .filter((participantUserId) => participantUserId !== senderId);

      return {
        message: createdMessage,
        participantStates,
        recipientUserIds,
      };
    });

    await Promise.all(
      payload.participantStates.map(({ userId, unreadCount }) =>
        this.setUnreadCountCache(dto.conversationId, userId, unreadCount),
      ),
    );

    const preview = dto.body?.slice(0, 180) ?? `[${dto.type}]`;

    if (payload.recipientUserIds.length > 0) {
      await this.notificationsService.queueNewMessageNotification({
        conversationId: dto.conversationId,
        senderId,
        recipientUserIds: payload.recipientUserIds,
        preview,
      });
    }

    return {
      message: this.toMessageRecord(payload.message),
      unreadByUser: payload.participantStates.map((state) => ({
        userId: state.userId,
        count: state.unreadCount,
      })),
      recipientUserIds: payload.recipientUserIds,
    };
  }

  async markAsRead(
    userId: string,
    dto: MarkAsReadDto,
  ): Promise<{ conversationId: string; userId: string; lastReadAt: Date; unreadCount: number }> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bu konuşma için erişim yetkiniz yok.');
    }

    let nextLastReadAt = new Date();

    if (dto.lastMessageId) {
      const message = await this.prisma.message.findFirst({
        where: {
          id: dto.lastMessageId,
          conversationId: dto.conversationId,
        },
        select: {
          createdAt: true,
        },
      });

      if (message) {
        nextLastReadAt = message.createdAt;
      }
    }

    const updated = await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: nextLastReadAt,
      },
      select: {
        unreadCount: true,
        lastReadAt: true,
      },
    });

    await this.setUnreadCountCache(dto.conversationId, userId, 0);

    return {
      conversationId: dto.conversationId,
      userId,
      lastReadAt: updated.lastReadAt,
      unreadCount: updated.unreadCount,
    };
  }

  async assertParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bu konuşma için erişim yetkiniz yok.');
    }
  }

  async getConversationIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
      },
      select: {
        conversationId: true,
      },
    });

    return rows.map((row) => row.conversationId);
  }

  async getParticipantUserIds(conversationId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId,
      },
      select: {
        userId: true,
      },
    });

    return participants.map((participant) => participant.userId);
  }

  private async findConversationOrThrow(
    conversationId: string,
  ): Promise<ConversationWithRelations> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        productListing: {
          select: {
            id: true,
            name: true,
            media: {
              where: {
                mediaType: 'IMAGE',
              },
              orderBy: {
                displayOrder: 'asc',
              },
              take: 1,
              select: {
                id: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                companyName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            attachments: true,
            quote: {
              include: {
                productListing: {
                  select: {
                    name: true,
                    media: {
                      where: {
                        mediaType: 'IMAGE',
                      },
                      orderBy: {
                        displayOrder: 'asc',
                      },
                      take: 1,
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Konuşma bulunamadı.');
    }

    return conversation;
  }

  private ensureParticipant(
    participants:
      | Array<{ userId: string }>
      | Array<{ userId: string; unreadCount: number; lastReadAt: Date }>,
    userId: string,
  ): void {
    const hasParticipant = participants.some((participant) => participant.userId === userId);
    if (!hasParticipant) {
      throw new ForbiddenException('Bu konuşma için erişim yetkiniz yok.');
    }
  }

  private toConversationListItem(
    conversation: ConversationWithRelations,
    unreadCount: number,
    hasPendingQuote: boolean,
  ): ConversationListItem {
    return {
      id: conversation.id,
      productListingId: conversation.productListingId,
      productName: conversation.productListing?.name ?? null,
      productImageMediaId: conversation.productListing?.media[0]?.id ?? null,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      participants: conversation.participants.map((participant) => ({
        userId: participant.userId,
        fullName: participant.user.fullName,
        email: participant.user.email,
        companyName: participant.user.companyName,
        avatarUrl: participant.user.avatarUrl,
        role: participant.user.role,
        unreadCount: participant.unreadCount,
        lastReadAt: participant.lastReadAt,
      })),
      unreadCount,
      lastMessage: conversation.messages[0]
        ? this.toMessageRecord(conversation.messages[0])
        : null,
      hasPendingQuote,
    };
  }

  private toMessageRecord(
    message: {
      id: string;
      conversationId: string;
      senderId: string;
      type: MessageType;
      body: string | null;
      isEdited: boolean;
      deletedAt: Date | null;
      createdAt: Date;
      attachments: Array<{
        id: string;
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
      quote: {
        id: string;
        productListingId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        logisticsFee: Prisma.Decimal | null;
        currency: string;
        productListing?: {
          name: string;
          media: Array<{ id: string }>;
        };
        notes: string | null;
        status: QuoteStatus;
        expiresAt: Date;
        counterQuoteId: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    },
  ): MessageRecord {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      body: message.body,
      isEdited: message.isEdited,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
      })),
      quote: message.quote
        ? {
            id: message.quote.id,
            productListingId: message.quote.productListingId,
            quantity: message.quote.quantity,
            unitPrice: Number(message.quote.unitPrice),
            logisticsFee: message.quote.logisticsFee ? Number(message.quote.logisticsFee) : null,
            currency: message.quote.currency,
            productName: message.quote.productListing?.name ?? null,
            productImageMediaId: message.quote.productListing?.media[0]?.id ?? null,
            notes: message.quote.notes,
            status: message.quote.status,
            expiresAt: message.quote.expiresAt,
            counterQuoteId: message.quote.counterQuoteId,
            createdAt: message.quote.createdAt,
            updatedAt: message.quote.updatedAt,
          }
        : null,
    };
  }

  private toAttachmentCreateInput(attachment: MessageAttachmentDto): {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  } {
    return {
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
    };
  }

  private unreadCacheKey(conversationId: string, userId: string): string {
    return `conv:${conversationId}:user:${userId}:unread`;
  }

  private async getUnreadCount(
    userId: string,
    conversationId: string,
    participants: Array<{ userId: string; unreadCount: number }>,
  ): Promise<number> {
    const key = this.unreadCacheKey(conversationId, userId);
    const cachedValue = await this.redisService.get(key);

    if (cachedValue !== null) {
      const parsed = Number(cachedValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const unreadCount = participants.find((participant) => participant.userId === userId)?.unreadCount ?? 0;
    await this.redisService.set(key, String(unreadCount), UNREAD_CACHE_TTL_SECONDS);

    return unreadCount;
  }

  private async setUnreadCountCache(
    conversationId: string,
    userId: string,
    count: number,
  ): Promise<void> {
    await this.redisService.set(
      this.unreadCacheKey(conversationId, userId),
      String(count),
      UNREAD_CACHE_TTL_SECONDS,
    );
  }
}
