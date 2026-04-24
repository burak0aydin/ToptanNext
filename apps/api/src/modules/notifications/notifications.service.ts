import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NOTIFICATION_JOB, NOTIFICATIONS_QUEUE } from './notifications.constants';

export type NewMessageNotificationPayload = {
  conversationId: string;
  senderId: string;
  recipientUserIds: string[];
  preview: string;
};

export type QuoteNotificationPayload = {
  quoteId: string;
  conversationId: string;
  initiatorUserId: string;
  recipientUserIds: string[];
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue,
  ) {}

  async queueNewMessageNotification(
    payload: NewMessageNotificationPayload,
  ): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.NEW_MESSAGE_NOTIFICATION,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
      },
    );
  }

  async queueQuoteReceived(payload: QuoteNotificationPayload): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.QUOTE_RECEIVED,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
      },
    );
  }

  async queueQuoteAccepted(payload: QuoteNotificationPayload): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.QUOTE_ACCEPTED,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
      },
    );
  }

  async queueQuoteExpired(payload: QuoteNotificationPayload): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.QUOTE_EXPIRED,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
      },
    );
  }
}
