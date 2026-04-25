import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MessageType,
  Prisma,
  QuoteStatus,
  Role,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateQuoteDto } from '../conversations/dto/create-quote.dto';

const UNREAD_CACHE_TTL_SECONDS = 60 * 60;

export type QuoteMessageRecord = {
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
  } | null;
};

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async getQuoteById(quoteId: string, requesterUserId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                participants: true,
              },
            },
          },
        },
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
    });

    if (!quote) {
      throw new NotFoundException('Teklif bulunamadı.');
    }

    const isParticipant = quote.message.conversation.participants.some(
      (participant) => participant.userId === requesterUserId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu teklif için erişim yetkiniz yok.');
    }

    return {
      id: quote.id,
      messageId: quote.messageId,
      productListingId: quote.productListingId,
      quantity: quote.quantity,
      unitPrice: Number(quote.unitPrice),
      logisticsFee: quote.logisticsFee ? Number(quote.logisticsFee) : null,
      currency: quote.currency,
      productName: quote.productListing.name,
      productImageMediaId: quote.productListing.media[0]?.id ?? null,
      notes: quote.notes,
      status: quote.status,
      expiresAt: quote.expiresAt,
      counterQuoteId: quote.counterQuoteId,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      conversationId: quote.message.conversationId,
    };
  }

  async createQuoteOffer(
    conversationId: string,
    senderId: string,
    data: CreateQuoteDto,
  ): Promise<{
    message: QuoteMessageRecord;
    unreadByUser: Array<{ userId: string; count: number }>;
    recipientUserIds: string[];
    canceledQuoteIds: string[];
  }> {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: {
        role: true,
      },
    });

    if (!sender) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (sender.role !== Role.SUPPLIER) {
      throw new ForbiddenException('Sadece satıcılar teklif gönderebilir.');
    }

    const payload = await this.createQuoteMessageTransaction(
      conversationId,
      senderId,
      MessageType.QUOTE_OFFER,
      data,
    );

    this.realtimeService.emitToConversation(conversationId, 'new_message', payload.message);
    payload.canceledQuoteIds.forEach((quoteId) => {
      this.realtimeService.emitToConversation(conversationId, 'quote_status_updated', {
        conversationId,
        quoteId,
        status: QuoteStatus.CANCELED,
        updatedAt: new Date().toISOString(),
      });
    });
    payload.unreadByUser.forEach((item) => {
      this.realtimeService.emitToUser(item.userId, 'unread_count_updated', {
        conversationId,
        count: item.count,
      });
    });

    if (payload.message.quote) {
      await this.notificationsService.queueQuoteReceived({
        quoteId: payload.message.quote.id,
        conversationId,
        initiatorUserId: senderId,
        recipientUserIds: payload.recipientUserIds,
      });
    }

    return payload;
  }

  async createCounterOffer(
    originalQuoteId: string,
    actorUserId: string,
    data: CreateQuoteDto,
  ): Promise<{
    message: QuoteMessageRecord;
    originalQuoteId: string;
    unreadByUser: Array<{ userId: string; count: number }>;
    recipientUserIds: string[];
  }> {
    const originalQuote = await this.prisma.quote.findUnique({
      where: {
        id: originalQuoteId,
      },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                participants: true,
              },
            },
          },
        },
      },
    });

    if (!originalQuote) {
      throw new NotFoundException('Karşı teklif için hedef teklif bulunamadı.');
    }

    const isParticipant = originalQuote.message.conversation.participants.some(
      (participant) => participant.userId === actorUserId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu konuşma için erişim yetkiniz yok.');
    }

    if (originalQuote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Sadece bekleyen teklife karşı teklif verebilirsiniz.');
    }

    if (originalQuote.expiresAt.getTime() < Date.now()) {
      await this.prisma.quote.update({
        where: { id: originalQuote.id },
        data: { status: QuoteStatus.EXPIRED },
      });

      throw new BadRequestException('Teklifin süresi dolmuş.');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: originalQuote.id },
        data: { status: QuoteStatus.COUNTERED },
      });

      const quotePayload = this.normalizeQuotePayload(
        data,
        originalQuote.message.conversation.productListingId ?? null,
      );

      const createdMessage = await tx.message.create({
        data: {
          conversationId: originalQuote.message.conversationId,
          senderId: actorUserId,
          type: MessageType.COUNTER_OFFER,
          body: quotePayload.notes,
          quote: {
            create: {
              productListingId: quotePayload.productListingId,
              quantity: quotePayload.quantity,
              unitPrice: quotePayload.unitPrice,
              logisticsFee: quotePayload.logisticsFee,
              currency: quotePayload.currency,
              notes: quotePayload.notes,
              expiresAt: quotePayload.expiresAt,
              counterQuoteId: originalQuote.id,
            },
          },
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
        where: { id: originalQuote.message.conversationId },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: originalQuote.message.conversationId,
          userId: {
            not: actorUserId,
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
            conversationId: originalQuote.message.conversationId,
            userId: actorUserId,
          },
        },
        data: {
          lastReadAt: createdMessage.createdAt,
        },
      });

      const participantStates = await tx.conversationParticipant.findMany({
        where: {
          conversationId: originalQuote.message.conversationId,
        },
        select: {
          userId: true,
          unreadCount: true,
        },
      });

      const recipientUserIds = originalQuote.message.conversation.participants
        .map((participant) => participant.userId)
        .filter((participantUserId) => participantUserId !== actorUserId);

      return {
        message: createdMessage,
        participantStates,
        recipientUserIds,
      };
    });

    await Promise.all(
      payload.participantStates.map(({ userId, unreadCount }) =>
        this.setUnreadCountCache(originalQuote.message.conversationId, userId, unreadCount),
      ),
    );

    this.realtimeService.emitToConversation(
      originalQuote.message.conversationId,
      'quote_status_updated',
      {
        conversationId: originalQuote.message.conversationId,
        quoteId: originalQuote.id,
        status: QuoteStatus.COUNTERED,
        updatedAt: new Date().toISOString(),
      },
    );

    const messageRecord = this.toMessageRecord(payload.message);
    this.realtimeService.emitToConversation(originalQuote.message.conversationId, 'new_message', messageRecord);
    payload.participantStates.forEach((state) => {
      this.realtimeService.emitToUser(state.userId, 'unread_count_updated', {
        conversationId: originalQuote.message.conversationId,
        count: state.unreadCount,
      });
    });

    if (messageRecord.quote) {
      await this.notificationsService.queueQuoteReceived({
        quoteId: messageRecord.quote.id,
        conversationId: originalQuote.message.conversationId,
        initiatorUserId: actorUserId,
        recipientUserIds: payload.recipientUserIds,
      });
    }

    return {
      message: messageRecord,
      originalQuoteId: originalQuote.id,
      unreadByUser: payload.participantStates.map((state) => ({
        userId: state.userId,
        count: state.unreadCount,
      })),
      recipientUserIds: payload.recipientUserIds,
    };
  }

  async acceptQuote(
    quoteId: string,
    actorUserId: string,
  ): Promise<{ quoteId: string; status: QuoteStatus; updatedAt: Date; conversationId: string }> {
    const requester = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true },
    });

    if (!requester) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                participants: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Teklif bulunamadı.');
    }

    const isParticipant = quote.message.conversation.participants.some(
      (participant) => participant.userId === actorUserId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu teklif için erişim yetkiniz yok.');
    }

    if (quote.message.senderId === actorUserId) {
      throw new ForbiddenException('Kendi gönderdiğiniz teklifi kabul edemezsiniz.');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Sadece bekleyen teklif kabul edilebilir.');
    }

    if (quote.expiresAt.getTime() < Date.now()) {
      await this.prisma.quote.update({
        where: {
          id: quote.id,
        },
        data: {
          status: QuoteStatus.EXPIRED,
        },
      });

      throw new BadRequestException('Teklifin süresi dolmuş.');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      await tx.quote.updateMany({
        where: {
          id: {
            not: quote.id,
          },
          status: QuoteStatus.PENDING,
          message: {
            conversationId: quote.message.conversationId,
          },
        },
        data: {
          status: QuoteStatus.EXPIRED,
        },
      });

      const acceptedQuote = await tx.quote.update({
        where: {
          id: quote.id,
        },
        data: {
          status: QuoteStatus.ACCEPTED,
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      const statusMessage = await tx.message.create({
        data: {
          conversationId: quote.message.conversationId,
          senderId: actorUserId,
          type: MessageType.QUOTE_ACCEPTED,
          body: `Teklif #${quote.id} kabul edildi.`,
        },
        select: {
          createdAt: true,
        },
      });

      await tx.conversation.update({
        where: {
          id: quote.message.conversationId,
        },
        data: {
          lastMessageAt: statusMessage.createdAt,
        },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: quote.message.conversationId,
          userId: {
            not: actorUserId,
          },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });

      const participantStates = await tx.conversationParticipant.findMany({
        where: {
          conversationId: quote.message.conversationId,
        },
        select: {
          userId: true,
          unreadCount: true,
        },
      });

      return {
        acceptedQuote,
        participantStates,
      };
    });

    await Promise.all(
      payload.participantStates.map((item) =>
        this.setUnreadCountCache(quote.message.conversationId, item.userId, item.unreadCount),
      ),
    );

    this.realtimeService.emitToConversation(quote.message.conversationId, 'quote_status_updated', {
      conversationId: quote.message.conversationId,
      quoteId: payload.acceptedQuote.id,
      status: payload.acceptedQuote.status,
      updatedAt: payload.acceptedQuote.updatedAt,
    });

    payload.participantStates.forEach((item) => {
      this.realtimeService.emitToUser(item.userId, 'unread_count_updated', {
        conversationId: quote.message.conversationId,
        count: item.unreadCount,
      });
    });

    const recipientUserIds = quote.message.conversation.participants
      .map((participant) => participant.userId)
      .filter((userId) => userId !== actorUserId);

    await this.notificationsService.queueQuoteAccepted({
      quoteId,
      conversationId: quote.message.conversationId,
      initiatorUserId: actorUserId,
      recipientUserIds,
    });

    return {
      quoteId: payload.acceptedQuote.id,
      status: payload.acceptedQuote.status,
      updatedAt: payload.acceptedQuote.updatedAt,
      conversationId: quote.message.conversationId,
    };
  }

  async rejectQuote(
    quoteId: string,
    actorUserId: string,
  ): Promise<{ quoteId: string; status: QuoteStatus; updatedAt: Date; conversationId: string }> {
    const requester = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true },
    });

    if (!requester) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                participants: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Teklif bulunamadı.');
    }

    const isParticipant = quote.message.conversation.participants.some(
      (participant) => participant.userId === actorUserId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bu teklif için erişim yetkiniz yok.');
    }

    if (quote.message.senderId === actorUserId) {
      throw new ForbiddenException('Kendi gönderdiğiniz teklifi reddedemezsiniz.');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Sadece bekleyen teklif reddedilebilir.');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.REJECTED },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      const statusMessage = await tx.message.create({
        data: {
          conversationId: quote.message.conversationId,
          senderId: actorUserId,
          type: MessageType.QUOTE_REJECTED,
          body: `Teklif #${quote.id} reddedildi.`,
        },
        select: {
          createdAt: true,
        },
      });

      await tx.conversation.update({
        where: { id: quote.message.conversationId },
        data: { lastMessageAt: statusMessage.createdAt },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: quote.message.conversationId,
          userId: { not: actorUserId },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      const participantStates = await tx.conversationParticipant.findMany({
        where: { conversationId: quote.message.conversationId },
        select: { userId: true, unreadCount: true },
      });

      return { updatedQuote, participantStates };
    });

    await Promise.all(
      payload.participantStates.map((item) =>
        this.setUnreadCountCache(quote.message.conversationId, item.userId, item.unreadCount),
      ),
    );

    this.realtimeService.emitToConversation(quote.message.conversationId, 'quote_status_updated', {
      conversationId: quote.message.conversationId,
      quoteId: payload.updatedQuote.id,
      status: payload.updatedQuote.status,
      updatedAt: payload.updatedQuote.updatedAt,
    });

    payload.participantStates.forEach((item) => {
      this.realtimeService.emitToUser(item.userId, 'unread_count_updated', {
        conversationId: quote.message.conversationId,
        count: item.unreadCount,
      });
    });

    return {
      quoteId: payload.updatedQuote.id,
      status: payload.updatedQuote.status,
      updatedAt: payload.updatedQuote.updatedAt,
      conversationId: quote.message.conversationId,
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expirePendingQuotes(): Promise<void> {
    const expiredQuotes = await this.prisma.quote.findMany({
      where: {
        status: QuoteStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      include: {
        message: {
          include: {
            conversation: {
              include: {
                participants: true,
              },
            },
          },
        },
      },
      take: 300,
    });

    if (expiredQuotes.length === 0) {
      return;
    }

    await this.prisma.quote.updateMany({
      where: {
        id: {
          in: expiredQuotes.map((quote) => quote.id),
        },
      },
      data: {
        status: QuoteStatus.EXPIRED,
      },
    });

    for (const quote of expiredQuotes) {
      this.realtimeService.emitToConversation(quote.message.conversationId, 'quote_status_updated', {
        quoteId: quote.id,
        status: QuoteStatus.EXPIRED,
        updatedAt: new Date().toISOString(),
      });

      const recipientUserIds = quote.message.conversation.participants.map(
        (participant) => participant.userId,
      );

      await this.notificationsService.queueQuoteExpired({
        quoteId: quote.id,
        conversationId: quote.message.conversationId,
        initiatorUserId: quote.message.senderId,
        recipientUserIds,
      });
    }
  }

  private async createQuoteMessageTransaction(
    conversationId: string,
    senderId: string,
    type: MessageType,
    data: CreateQuoteDto,
  ): Promise<{
    message: QuoteMessageRecord;
    unreadByUser: Array<{ userId: string; count: number }>;
    recipientUserIds: string[];
    canceledQuoteIds: string[];
  }> {
    const payload = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: {
          participants: true,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Konuşma bulunamadı.');
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.userId === senderId,
      );
      if (!isParticipant) {
        throw new ForbiddenException('Bu konuşma için erişim yetkiniz yok.');
      }

      let canceledQuoteIds: string[] = [];

      if (type === MessageType.QUOTE_OFFER) {
        const activePendingQuotes = await tx.quote.findMany({
          where: {
            status: QuoteStatus.PENDING,
            expiresAt: {
              gt: new Date(),
            },
            message: {
              conversationId,
            },
          },
          select: {
            id: true,
          },
        });

        canceledQuoteIds = activePendingQuotes.map((quote) => quote.id);

        if (canceledQuoteIds.length > 0) {
          await tx.quote.updateMany({
            where: {
              id: {
                in: canceledQuoteIds,
              },
            },
            data: {
              status: QuoteStatus.CANCELED,
            },
          });
        }
      }

      const quotePayload = this.normalizeQuotePayload(
        data,
        conversation.productListingId ?? null,
      );

      const createdMessage = await tx.message.create({
        data: {
          conversationId,
          senderId,
          type,
          body: quotePayload.notes,
          quote: {
            create: {
              productListingId: quotePayload.productListingId,
              quantity: quotePayload.quantity,
              unitPrice: quotePayload.unitPrice,
              logisticsFee: quotePayload.logisticsFee,
              currency: quotePayload.currency,
              notes: quotePayload.notes,
              expiresAt: quotePayload.expiresAt,
            },
          },
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
          id: conversationId,
        },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      });

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId,
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
            conversationId,
            userId: senderId,
          },
        },
        data: {
          lastReadAt: createdMessage.createdAt,
        },
      });

      const participantStates = await tx.conversationParticipant.findMany({
        where: {
          conversationId,
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
        message: this.toMessageRecord(createdMessage),
        participantStates,
        recipientUserIds,
        canceledQuoteIds,
      };
    });

    await Promise.all(
      payload.participantStates.map((item) =>
        this.setUnreadCountCache(conversationId, item.userId, item.unreadCount),
      ),
    );

    return {
      message: payload.message,
      unreadByUser: payload.participantStates.map((item) => ({
        userId: item.userId,
        count: item.unreadCount,
      })),
      recipientUserIds: payload.recipientUserIds,
      canceledQuoteIds: payload.canceledQuoteIds,
    };
  }

  private normalizeQuotePayload(
    data: CreateQuoteDto,
    fallbackProductListingId: string | null,
  ): {
    productListingId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    logisticsFee: Prisma.Decimal | null;
    currency: string;
    notes: string | null;
    expiresAt: Date;
  } {
    const productListingId = data.productListingId ?? fallbackProductListingId;
    if (!productListingId) {
      throw new BadRequestException('Teklif için ürün zorunludur.');
    }

    if (!Number.isFinite(data.quantity) || data.quantity < 1) {
      throw new BadRequestException('Teklif adedi geçersiz.');
    }

    if (!Number.isFinite(data.unitPrice) || data.unitPrice <= 0) {
      throw new BadRequestException('Teklif birim fiyatı geçersiz.');
    }

    if (
      data.logisticsFee !== undefined
      && (!Number.isFinite(data.logisticsFee) || data.logisticsFee < 0)
    ) {
      throw new BadRequestException('Lojistik ücreti geçersiz.');
    }

    const expiresInHours = data.expiresInHours ?? 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    return {
      productListingId,
      quantity: data.quantity,
      unitPrice: new Prisma.Decimal(data.unitPrice),
      logisticsFee: data.logisticsFee !== undefined
        ? new Prisma.Decimal(data.logisticsFee)
        : null,
      currency: data.currency?.trim() || 'TRY',
      notes: data.notes?.trim() || null,
      expiresAt,
    };
  }

  private toMessageRecord(message: {
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
  }): QuoteMessageRecord {
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

  private unreadCacheKey(conversationId: string, userId: string): string {
    return `conv:${conversationId}:user:${userId}:unread`;
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
