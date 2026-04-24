import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuotesModule } from '../quotes/quotes.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [JwtModule, NotificationsModule, QuotesModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsGateway],
  exports: [ConversationsService],
})
export class ConversationsModule {}
