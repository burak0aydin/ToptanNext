import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationStatus,
  ConversationType,
  LogisticsOfferStatus,
  LogisticsRequestStatus,
  MessageType,
  Prisma,
  QuoteStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateLogisticsOfferDto } from './dto/create-logistics-offer.dto';
import { CreateLogisticsRequestDto } from './dto/create-logistics-request.dto';
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
  conversationType: ConversationType;
  logisticsRequestId: string | null;
  productName: string | null;
  productImageMediaId: string | null;
  logisticsFromCity: string | null;
  logisticsToCity: string | null;
  logisticsPalletCount: number | null;
  logisticsItemCount: number | null;
  logisticsIsSellerDelivery: boolean;
  logisticsSellerDeliveryFee: number | null;
  status: ConversationStatus;
  lastMessageAt: Date;
  createdAt: Date;
  participants: ConversationParticipantSummary[];
  unreadCount: number;
  lastMessage: MessageRecord | null;
  hasPendingQuote: boolean;
  hasPendingLogistics: boolean;
  hasApprovedQuote: boolean;
};

export type LogisticsOfferRecord = {
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
  createdAt: Date;
  updatedAt: Date;
};

export type LogisticsOfferListItem = LogisticsOfferRecord & {
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

export type LogisticsRequestRecord = {
  id: string;
  conversationId: string;
  requesterId: string;
  fromCity: string;
  toCity: string;
  palletCount: number | null;
  itemCount: number | null;
  isSellerDelivery?: boolean;
  sellerDeliveryFee?: number | null;
  status: LogisticsRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  offers: LogisticsOfferRecord[];
  requesterCompanyName?: string | null;
  requesterName?: string | null;
  productName?: string | null;
  productImageMediaId?: string | null;
};

export type ConversationMessagesResult = {
  items: MessageRecord[];
  nextCursor: string | null;
};

type ConversationListFilters = {
  filter?: 'all' | 'pending_quotes' | 'unread' | 'logistics_pending' | 'approved';
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
    logisticsRequest: {
      select: {
        id: true;
        fromCity: true;
        toCity: true;
        palletCount: true;
        itemCount: true;
        isSellerDelivery: true;
        sellerDeliveryFee: true;
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
    private readonly realtimeService: RealtimeService,
  ) {}

  private async getOrCreateLogisticsConversation(
    prismaClient: PrismaService | Prisma.TransactionClient,
    requesterUserId: string,
    logisticsRequestId: string,
  ): Promise<string> {
    const requesterUser = await prismaClient.user.findUnique({
      where: { id: requesterUserId },
      select: {
        id: true,
        isLogisticsPartner: true,
      },
    });

    if (!requesterUser) {
      throw new NotFoundException('Oturum sahibi kullanıcı bulunamadı.');
    }

    if (!requesterUser.isLogisticsPartner) {
      throw new ForbiddenException('Sadece lojistik ortakları lojistik sohbeti başlatabilir.');
    }

    const logisticsRequest = await prismaClient.logisticsRequest.findUnique({
      where: { id: logisticsRequestId },
      select: {
        id: true,
        requesterId: true,
        conversation: {
          select: {
            productListingId: true,
          },
        },
      },
    });

    if (!logisticsRequest) {
      throw new NotFoundException('Lojistik talebi bulunamadı.');
    }

    if (logisticsRequest.requesterId === requesterUserId) {
      throw new BadRequestException('Kendi talebiniz için lojistik sohbeti başlatamazsınız.');
    }

    const existingConversation = await prismaClient.conversation.findFirst({
      where: {
        conversationType: ConversationType.LOGISTICS,
        logisticsRequestId,
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
                userId: logisticsRequest.requesterId,
              },
            },
          },
          {
            participants: {
              every: {
                userId: {
                  in: [requesterUserId, logisticsRequest.requesterId],
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

    if (existingConversation) {
      return existingConversation.id;
    }

    const createdConversation = await prismaClient.conversation.create({
      data: {
        conversationType: ConversationType.LOGISTICS,
        logisticsRequestId,
        productListingId: logisticsRequest.conversation.productListingId,
        participants: {
          create: [
            {
              userId: requesterUserId,
              unreadCount: 0,
            },
            {
              userId: logisticsRequest.requesterId,
              unreadCount: 0,
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    return createdConversation.id;
  }

  async createConversation(
    requesterUserId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationListItem> {
    if (dto.logisticsRequestId) {
      const conversationId = await this.getOrCreateLogisticsConversation(
        this.prisma,
        requesterUserId,
        dto.logisticsRequestId,
      );

      return this.getConversationById(requesterUserId, conversationId);
    }

    if (!dto.participantId) {
      throw new BadRequestException('Katılımcı bilgisi zorunludur.');
    }

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
        conversationType: ConversationType.PRODUCT,
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
          conversationType: ConversationType.PRODUCT,
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

    if (filters.filter === 'logistics_pending') {
      where.logisticsRequests = {
        some: {
          status: {
            in: [LogisticsRequestStatus.PENDING, LogisticsRequestStatus.COLLECTING],
          },
        },
      };
    }

    if (filters.filter === 'approved') {
      where.messages = {
        some: {
          quote: {
            status: QuoteStatus.ACCEPTED,
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
        logisticsRequest: {
          select: {
            id: true,
            fromCity: true,
            toCity: true,
            palletCount: true,
            itemCount: true,
            isSellerDelivery: true,
            sellerDeliveryFee: true,
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

    const approvedQuoteConversationIds = new Set(
      (
        await this.prisma.quote.findMany({
          where: {
            status: QuoteStatus.ACCEPTED,
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

    const pendingLogisticsConversationIds = new Set(
      (
        await this.prisma.logisticsRequest.findMany({
          where: {
            status: {
              in: [LogisticsRequestStatus.PENDING, LogisticsRequestStatus.COLLECTING],
            },
            conversationId: {
              in: conversationIds,
            },
          },
          select: {
            conversationId: true,
          },
        })
      ).map((request) => request.conversationId),
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
          pendingLogisticsConversationIds.has(conversation.id),
          approvedQuoteConversationIds.has(conversation.id),
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

    const hasApprovedQuote = await this.prisma.quote.count({
      where: {
        status: QuoteStatus.ACCEPTED,
        message: {
          conversationId,
        },
      },
    });

    const hasPendingLogistics = await this.prisma.logisticsRequest.count({
      where: {
        conversationId,
        status: {
          in: [LogisticsRequestStatus.PENDING, LogisticsRequestStatus.COLLECTING],
        },
      },
    });

    return this.toConversationListItem(
      conversation,
      unreadCount,
      hasPendingQuote > 0,
      hasPendingLogistics > 0,
      hasApprovedQuote > 0,
    );
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

  async getLatestLogisticsRequest(
    userId: string,
    conversationId: string,
  ): Promise<LogisticsRequestRecord | null> {
    await this.assertParticipant(conversationId, userId);

    const request = await this.prisma.logisticsRequest.findFirst({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        offers: {
          include: {
            partner: {
              select: {
                id: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    return this.toLogisticsRequestRecord(request);
  }

  async getOpenLogisticsRequests(userId: string): Promise<LogisticsRequestRecord[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isLogisticsPartner: true },
    });

    if (!user?.isLogisticsPartner) {
      throw new ForbiddenException('Sadece lojistik ortakları açık yük ilanlarını görüntüleyebilir.');
    }

    const requests = await this.prisma.logisticsRequest.findMany({
      where: {
        status: {
          in: [LogisticsRequestStatus.PENDING, LogisticsRequestStatus.COLLECTING],
        },
      },
      include: {
        requester: {
          select: {
            fullName: true,
            companyName: true,
          },
        },
        conversation: {
          select: {
            productListing: {
              select: {
                name: true,
                media: {
                  where: { mediaType: 'IMAGE' },
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                  select: { id: true },
                },
              },
            },
          },
        },
        offers: {
          include: {
            partner: {
              select: {
                id: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    return requests.map((request) => ({
      ...this.toLogisticsRequestRecord(request),
      requesterCompanyName: request.requester.companyName,
      requesterName: request.requester.fullName,
      productName: request.conversation.productListing?.name ?? null,
      productImageMediaId: request.conversation.productListing?.media[0]?.id ?? null,
    }));
  }

  async getMyLogisticsOffers(userId: string): Promise<LogisticsOfferListItem[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isLogisticsPartner: true },
    });

    if (!user?.isLogisticsPartner) {
      throw new ForbiddenException('Sadece lojistik ortakları kendi tekliflerini görüntüleyebilir.');
    }

    const offers = await this.prisma.logisticsOffer.findMany({
      where: {
        partnerId: userId,
      },
      include: {
        partner: {
          select: {
            id: true,
            companyName: true,
            avatarUrl: true,
          },
        },
        request: {
          select: {
            id: true,
            conversationId: true,
            requesterId: true,
            fromCity: true,
            toCity: true,
            status: true,
            isSellerDelivery: true,
            sellerDeliveryFee: true,
            requester: {
              select: {
                fullName: true,
                companyName: true,
              },
            },
            conversation: {
              select: {
                productListing: {
                  select: {
                    name: true,
                    media: {
                      where: { mediaType: 'IMAGE' },
                      orderBy: { displayOrder: 'asc' },
                      take: 1,
                      select: { id: true },
                    },
                  },
                },
              },
            },
            logisticsConversations: {
              select: {
                id: true,
                conversationType: true,
                participants: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 200,
    });

    return offers.map((offer) => ({
      ...this.toLogisticsOfferRecord(offer),
      conversationId:
        offer.request.logisticsConversations.find(
          (conversation) =>
            conversation.conversationType === ConversationType.LOGISTICS
            && conversation.participants.some((participant) => participant.userId === userId)
            && conversation.participants.some((participant) => participant.userId === offer.request.requesterId),
        )?.id ?? offer.request.conversationId,
      requestStatus: offer.request.status,
      fromCity: offer.request.fromCity,
      toCity: offer.request.toCity,
      requesterCompanyName: offer.request.requester.companyName,
      requesterName: offer.request.requester.fullName,
      productName: offer.request.conversation.productListing?.name ?? null,
      productImageMediaId: offer.request.conversation.productListing?.media[0]?.id ?? null,
      isSellerDelivery: offer.request.isSellerDelivery,
      sellerDeliveryFee: offer.request.sellerDeliveryFee ? Number(offer.request.sellerDeliveryFee) : null,
    }));
  }

  async getLogisticsRequestById(
    userId: string,
    requestId: string,
  ): Promise<LogisticsRequestRecord> {
    const request = await this.prisma.logisticsRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
        offers: {
          include: {
            partner: {
              select: {
                id: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Lojistik talebi bulunamadı.');
    }

    const isParticipant = request.conversation.participants.some(
      (participant) => participant.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu lojistik talebi için erişim yetkiniz yok.');
    }

    return this.toLogisticsRequestRecord(request);
  }

  async createLogisticsRequest(
    requesterId: string,
    conversationId: string,
    dto: CreateLogisticsRequestDto,
  ): Promise<LogisticsRequestRecord> {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });

    if (!requester) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (requester.role !== Role.SUPPLIER) {
      throw new ForbiddenException('Sadece satıcılar lojistik talebi oluşturabilir.');
    }

    await this.assertParticipant(conversationId, requesterId);

    const request = await this.prisma.$transaction(async (tx) => {
      await tx.logisticsRequest.updateMany({
        where: {
          conversationId,
          status: {
            in: [LogisticsRequestStatus.PENDING, LogisticsRequestStatus.COLLECTING],
          },
        },
        data: {
          status: LogisticsRequestStatus.CANCELED,
        },
      });

      return tx.logisticsRequest.create({
        data: {
          conversationId,
          requesterId,
          fromCity: dto.fromCity.trim(),
          toCity: dto.toCity.trim(),
          palletCount: dto.palletCount ?? null,
          itemCount: dto.itemCount ?? null,
          isSellerDelivery: dto.isSellerDelivery ?? false,
          sellerDeliveryFee: dto.sellerDeliveryFee ? new Prisma.Decimal(dto.sellerDeliveryFee) : null,
        },
        include: {
          offers: {
            include: {
              partner: {
                select: {
                  id: true,
                  companyName: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
      });
    });

    const record = this.toLogisticsRequestRecord(request);
    this.realtimeService.emitToConversation(conversationId, 'logistics_request_created', record);

    const logisticsPartners = await this.prisma.user.findMany({
      where: {
        isLogisticsPartner: true,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    logisticsPartners.forEach((partner) => {
      this.realtimeService.emitToUser(partner.id, 'logistics_request_created', record);
    });

    return record;
  }

  async createLogisticsOffer(
    partnerId: string,
    requestId: string,
    dto: CreateLogisticsOfferDto,
  ): Promise<LogisticsOfferRecord> {
    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { isLogisticsPartner: true, companyName: true, avatarUrl: true },
    });

    if (!partner) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (!partner.isLogisticsPartner) {
      throw new ForbiddenException('Sadece lojistik ortakları teklif verebilir.');
    }

    const request = await this.prisma.logisticsRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        conversationId: true,
        requesterId: true,
        fromCity: true,
        toCity: true,
        palletCount: true,
        itemCount: true,
        conversation: {
          select: {
            productListing: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Lojistik talebi bulunamadı.');
    }

    if (request.status === LogisticsRequestStatus.CLOSED) {
      throw new BadRequestException('Bu lojistik talebi kapatılmış.');
    }

    const { offer, message } = await this.prisma.$transaction(async (tx) => {
      const logisticsConversationId = await this.getOrCreateLogisticsConversation(
        tx,
        partnerId,
        requestId,
      );

      const created = await tx.logisticsOffer.upsert({
        where: {
          requestId_partnerId: {
            requestId,
            partnerId,
          },
        },
        update: {
          price: new Prisma.Decimal(dto.price),
          currency: dto.currency?.trim() || 'TRY',
          estimatedDays: dto.estimatedDays,
          isInsured: dto.isInsured ?? false,
          notes: dto.notes?.trim() || null,
          status: LogisticsOfferStatus.OFFERED,
        },
        create: {
          requestId,
          partnerId,
          price: new Prisma.Decimal(dto.price),
          currency: dto.currency?.trim() || 'TRY',
          estimatedDays: dto.estimatedDays,
          isInsured: dto.isInsured ?? false,
          notes: dto.notes?.trim() || null,
          status: LogisticsOfferStatus.OFFERED,
        },
        include: {
          partner: {
            select: {
              id: true,
              companyName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (request.status === LogisticsRequestStatus.PENDING) {
        await tx.logisticsRequest.update({
          where: { id: requestId },
          data: { status: LogisticsRequestStatus.COLLECTING },
        });
      }

      const price = Number(dto.price).toLocaleString('tr-TR', {
        maximumFractionDigits: 2,
      });
      const route = `${request.fromCity} → ${request.toCity}`;
      const loadSummary = [
        request.palletCount ? `${request.palletCount} palet` : null,
        request.itemCount ? `${request.itemCount} adet` : null,
      ].filter(Boolean).join(' / ');
      const messageBody = [
        `Lojistik teklifim hazır: ${route}.`,
        request.conversation.productListing?.name
          ? `Ürün: ${request.conversation.productListing.name}.`
          : null,
        loadSummary ? `Yük: ${loadSummary}.` : null,
        `Teklif: ${price} ${dto.currency?.trim() || 'TRY'}, tahmini ${dto.estimatedDays} gün${dto.isInsured ? ', sigortalı taşıma' : ''}.`,
        dto.notes?.trim() ? `Not: ${dto.notes.trim()}` : null,
      ].filter(Boolean).join(' ');

      const createdMessage = await tx.message.create({
        data: {
          conversationId: logisticsConversationId,
          senderId: partnerId,
          type: MessageType.TEXT,
          body: messageBody,
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
        where: { id: logisticsConversationId },
        data: { lastMessageAt: createdMessage.createdAt },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: logisticsConversationId,
          userId: {
            not: partnerId,
          },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });

      return {
        offer: created,
        message: createdMessage,
      };
    });

    const record = this.toLogisticsOfferRecord(offer);
    const messageRecord = this.toMessageRecord(message);
    this.realtimeService.emitToConversation(message.conversationId, 'logistics_offer_created', {
      requestId,
      offer: record,
    });
    this.realtimeService.emitToConversation(message.conversationId, 'new_message', messageRecord);
    this.realtimeService.emitToUser(request.requesterId, 'logistics_offer_created', {
      requestId,
      offer: record,
    });

    return record;
  }

  async selectLogisticsOffer(
    actorUserId: string,
    offerId: string,
  ): Promise<LogisticsOfferRecord> {
    const offer = await this.prisma.logisticsOffer.findUnique({
      where: { id: offerId },
      include: {
        request: true,
        partner: {
          select: {
            id: true,
            companyName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Lojistik teklifi bulunamadı.');
    }

    if (offer.request.requesterId !== actorUserId) {
      throw new ForbiddenException('Bu lojistik teklifini seçme yetkiniz yok.');
    }

    if (offer.request.status === LogisticsRequestStatus.CLOSED) {
      throw new BadRequestException('Lojistik talebi zaten kapatıldı.');
    }

    const selectedOffer = await this.prisma.$transaction(async (tx) => {
      await tx.logisticsOffer.updateMany({
        where: {
          requestId: offer.requestId,
        },
        data: {
          status: LogisticsOfferStatus.REJECTED,
        },
      });

      const updatedOffer = await tx.logisticsOffer.update({
        where: {
          id: offerId,
        },
        data: {
          status: LogisticsOfferStatus.SELECTED,
        },
        include: {
          partner: {
            select: {
              id: true,
              companyName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.logisticsRequest.update({
        where: { id: offer.requestId },
        data: { status: LogisticsRequestStatus.CLOSED },
      });

      return updatedOffer;
    });

    const record = this.toLogisticsOfferRecord(selectedOffer);
    this.realtimeService.emitToConversation(offer.request.conversationId, 'logistics_offer_selected', {
      requestId: offer.requestId,
      offer: record,
    });
    this.realtimeService.emitToUser(offer.partnerId, 'logistics_offer_selected', {
      requestId: offer.requestId,
      offer: record,
    });

    return record;
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
        logisticsRequest: {
          select: {
            id: true,
            fromCity: true,
            toCity: true,
            palletCount: true,
            itemCount: true,
            isSellerDelivery: true,
            sellerDeliveryFee: true,
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
    hasPendingLogistics: boolean,
    hasApprovedQuote: boolean,
  ): ConversationListItem {
    return {
      id: conversation.id,
      productListingId: conversation.productListingId,
      conversationType: conversation.conversationType,
      logisticsRequestId: conversation.logisticsRequestId,
      productName: conversation.productListing?.name ?? null,
      productImageMediaId: conversation.productListing?.media[0]?.id ?? null,
      logisticsFromCity: conversation.logisticsRequest?.fromCity ?? null,
      logisticsToCity: conversation.logisticsRequest?.toCity ?? null,
      logisticsPalletCount: conversation.logisticsRequest?.palletCount ?? null,
      logisticsItemCount: conversation.logisticsRequest?.itemCount ?? null,
      logisticsIsSellerDelivery: conversation.logisticsRequest?.isSellerDelivery ?? false,
      logisticsSellerDeliveryFee: conversation.logisticsRequest?.sellerDeliveryFee
        ? Number(conversation.logisticsRequest.sellerDeliveryFee)
        : null,
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
      hasPendingLogistics,
      hasApprovedQuote,
    };
  }

  private toLogisticsOfferRecord(offer: {
    id: string;
    requestId: string;
    partnerId: string;
    price: Prisma.Decimal;
    currency: string;
    estimatedDays: number;
    isInsured: boolean;
    notes: string | null;
    status: LogisticsOfferStatus;
    createdAt: Date;
    updatedAt: Date;
    partner?: { companyName: string | null; avatarUrl: string | null } | null;
  }): LogisticsOfferRecord {
    return {
      id: offer.id,
      requestId: offer.requestId,
      partnerId: offer.partnerId,
      partnerCompanyName: offer.partner?.companyName ?? null,
      partnerAvatarUrl: offer.partner?.avatarUrl ?? null,
      price: Number(offer.price),
      currency: offer.currency,
      estimatedDays: offer.estimatedDays,
      isInsured: offer.isInsured,
      notes: offer.notes,
      status: offer.status,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }

  private toLogisticsRequestRecord(request: {
    id: string;
    conversationId: string;
    requesterId: string;
    fromCity: string;
    toCity: string;
    palletCount: number | null;
    itemCount: number | null;
    isSellerDelivery?: boolean;
    sellerDeliveryFee?: Prisma.Decimal | null;
    status: LogisticsRequestStatus;
    createdAt: Date;
    updatedAt: Date;
    offers: Array<{
      id: string;
      requestId: string;
      partnerId: string;
      price: Prisma.Decimal;
      currency: string;
      estimatedDays: number;
      isInsured: boolean;
      notes: string | null;
      status: LogisticsOfferStatus;
      createdAt: Date;
      updatedAt: Date;
      partner?: { companyName: string | null; avatarUrl: string | null } | null;
    }>;
  }): LogisticsRequestRecord {
    return {
      id: request.id,
      conversationId: request.conversationId,
      requesterId: request.requesterId,
      fromCity: request.fromCity,
      toCity: request.toCity,
      palletCount: request.palletCount,
      itemCount: request.itemCount,
      isSellerDelivery: request.isSellerDelivery ?? false,
      sellerDeliveryFee: request.sellerDeliveryFee ? Number(request.sellerDeliveryFee) : null,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      offers: request.offers.map((offer) => this.toLogisticsOfferRecord(offer)),
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
