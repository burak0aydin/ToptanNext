import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessageType } from '@prisma/client';
import { type Server, type Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { QuotesService } from '../quotes/quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsService } from './conversations.service';

type AuthedSocket = Socket & {
  data: {
    user?: JwtPayload;
  };
};

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ConversationsGateway
  implements OnGatewayInit, OnGatewayConnection
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly quotesService: QuotesService,
    private readonly redisService: RedisService,
    private readonly realtimeService: RealtimeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
  }

  async handleConnection(client: AuthedSocket): Promise<void> {
    const token = this.extractSocketToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'local-dev-secret'),
      });

      client.data.user = payload;
      client.join(`user:${payload.sub}`);

      const conversationIds = await this.conversationsService.getConversationIdsForUser(
        payload.sub,
      );

      conversationIds.forEach((conversationId) => {
        client.join(`conv:${conversationId}`);
      });
    } catch (error) {
      this.logger.warn(`Socket bağlantısı reddedildi: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.conversationsService.assertParticipant(payload.conversationId, user.sub);
    client.join(`conv:${payload.conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  async leaveConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.conversationsService.assertParticipant(payload.conversationId, user.sub);
    client.leave(`conv:${payload.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: SendMessageDto,
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.assertMessageRateLimit(user.sub, payload.conversationId);

    if (!Object.values(MessageType).includes(payload.type)) {
      throw new WsException('Geçersiz mesaj tipi.');
    }

    const result = await this.conversationsService.sendMessage(user.sub, payload);

    this.server.to(`conv:${payload.conversationId}`).emit('new_message', result.message);
    result.unreadByUser.forEach((item) => {
      this.server.to(`user:${item.userId}`).emit('unread_count_updated', {
        conversationId: payload.conversationId,
        count: item.count,
      });
    });
  }

  @SubscribeMessage('send_quote_offer')
  async sendQuoteOffer(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string; quoteData: CreateQuoteDto },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.quotesService.createQuoteOffer(
      payload.conversationId,
      user.sub,
      payload.quoteData,
    );
  }

  @SubscribeMessage('send_counter_offer')
  async sendCounterOffer(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    payload: {
      conversationId: string;
      originalQuoteId: string;
      quoteData: CreateQuoteDto;
    },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.conversationsService.assertParticipant(payload.conversationId, user.sub);
    await this.quotesService.createCounterOffer(
      payload.originalQuoteId,
      user.sub,
      payload.quoteData,
    );
  }

  @SubscribeMessage('accept_quote')
  async acceptQuote(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { quoteId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.quotesService.acceptQuote(payload.quoteId, user.sub);
  }

  @SubscribeMessage('reject_quote')
  async rejectQuote(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { quoteId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.quotesService.rejectQuote(payload.quoteId, user.sub);
  }

  @SubscribeMessage('typing_start')
  async typingStart(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.conversationsService.assertParticipant(payload.conversationId, user.sub);

    client.to(`conv:${payload.conversationId}`).emit('user_typing', {
      userId: user.sub,
      conversationId: payload.conversationId,
    });
  }

  @SubscribeMessage('typing_stop')
  async typingStop(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.conversationsService.assertParticipant(payload.conversationId, user.sub);

    client.to(`conv:${payload.conversationId}`).emit('user_stopped_typing', {
      userId: user.sub,
      conversationId: payload.conversationId,
    });
  }

  @SubscribeMessage('mark_as_read')
  async markAsRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: MarkAsReadDto,
  ): Promise<void> {
    const user = this.requireUser(client);
    const result = await this.conversationsService.markAsRead(user.sub, payload);

    this.server.to(`conv:${result.conversationId}`).emit('messages_read', {
      conversationId: result.conversationId,
      userId: result.userId,
      lastReadAt: result.lastReadAt,
    });

    this.server.to(`user:${result.userId}`).emit('unread_count_updated', {
      conversationId: result.conversationId,
      count: result.unreadCount,
    });
  }

  private requireUser(client: AuthedSocket): JwtPayload {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Kimlik doğrulaması başarısız.');
    }

    return user;
  }

  private extractSocketToken(client: Socket): string | null {
    const authToken =
      (client.handshake.auth as Record<string, unknown> | undefined)?.token;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.length > 0) {
      return authorization.replace(/^Bearer\s+/i, '').trim();
    }

    return null;
  }

  private async assertMessageRateLimit(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const key = `ratelimit:messages:${userId}:${conversationId}`;
    const current = await this.redisService.incr(key);

    if (current === 1) {
      await this.redisService.expire(key, 60);
    }

    if (current > 30) {
      throw new WsException('Dakikada en fazla 30 mesaj gönderebilirsiniz.');
    }
  }
}
