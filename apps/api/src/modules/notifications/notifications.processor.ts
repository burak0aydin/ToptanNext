import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { NOTIFICATION_JOB, NOTIFICATIONS_QUEUE } from './notifications.constants';
import {
  type NewMessageNotificationPayload,
  type QuoteNotificationPayload,
} from './notifications.service';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly transporter: Transporter | null;
  private readonly fromEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super();

    const smtpHost = configService.get<string>('SMTP_HOST');
    const smtpPort = Number(configService.get<string>('SMTP_PORT', '1025'));
    const smtpUser = configService.get<string>('SMTP_USER');
    const smtpPass = configService.get<string>('SMTP_PASS');

    this.fromEmail = configService.get<string>(
      'SMTP_FROM_EMAIL',
      'no-reply@toptannext.local',
    );

    if (!smtpHost) {
      this.transporter = null;
      this.logger.warn(
        'SMTP_HOST tanımlı değil. Bildirim e-postaları log olarak işlenecek.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  }

  async process(job: Job<NewMessageNotificationPayload | QuoteNotificationPayload>): Promise<void> {
    switch (job.name) {
      case NOTIFICATION_JOB.NEW_MESSAGE_NOTIFICATION:
        await this.processNewMessage(job.data as NewMessageNotificationPayload);
        return;
      case NOTIFICATION_JOB.QUOTE_RECEIVED:
        await this.processQuoteEvent('Yeni teklif aldınız', job.data as QuoteNotificationPayload);
        return;
      case NOTIFICATION_JOB.QUOTE_ACCEPTED:
        await this.processQuoteEvent('Teklifiniz kabul edildi', job.data as QuoteNotificationPayload);
        return;
      case NOTIFICATION_JOB.QUOTE_EXPIRED:
        await this.processQuoteEvent('Teklif süresi doldu', job.data as QuoteNotificationPayload);
        return;
      default:
        this.logger.warn(`Desteklenmeyen bildirim işi: ${job.name}`);
    }
  }

  private async processNewMessage(
    payload: NewMessageNotificationPayload,
  ): Promise<void> {
    const recipients = await this.resolveRecipientEmails(payload.recipientUserIds);
    if (recipients.length === 0) {
      return;
    }

    const subject = 'Yeni mesajınız var';
    const text = `Konuşma #${payload.conversationId} için yeni mesaj: ${payload.preview}`;

    await this.sendMail(recipients, subject, text);
  }

  private async processQuoteEvent(
    subject: string,
    payload: QuoteNotificationPayload,
  ): Promise<void> {
    const recipients = await this.resolveRecipientEmails(payload.recipientUserIds);
    if (recipients.length === 0) {
      return;
    }

    const text = `Konuşma #${payload.conversationId} içindeki teklif (#${payload.quoteId}) için güncelleme mevcut.`;
    await this.sendMail(recipients, subject, text);
  }

  private async resolveRecipientEmails(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        email: true,
        isActive: true,
      },
    });

    return users.filter((user) => user.isActive).map((user) => user.email);
  }

  private async sendMail(
    recipients: string[],
    subject: string,
    text: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `MAIL(SKIP) to=${recipients.join(',')} subject=${subject} text=${text}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: recipients.join(','),
      subject,
      text,
    });
  }
}
