import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NOTIFICATIONS_QUEUE } from './notifications.constants';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
  ],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
