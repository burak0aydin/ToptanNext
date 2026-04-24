import { Injectable } from '@nestjs/common';
import { type Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToConversation(conversationId: string, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }

    this.server.to(`conv:${conversationId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }

    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
