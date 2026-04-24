export const NOTIFICATIONS_QUEUE = 'notifications';

export const NOTIFICATION_JOB = {
  NEW_MESSAGE_NOTIFICATION: 'new_message_notification',
  QUOTE_RECEIVED: 'quote_received',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_EXPIRED: 'quote_expired',
} as const;

export type NotificationJobName =
  (typeof NOTIFICATION_JOB)[keyof typeof NOTIFICATION_JOB];
