import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * FCM push. Uses legacy HTTP API when FIREBASE_SERVER_KEY is set.
 * Without keys, logs only (safe for local/dev).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async notifyUser(userId: string, payload: PushPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, phone: true },
    });
    if (!user?.fcmToken) {
      this.logger.debug(`No FCM token for ${userId} (${user?.phone}) — ${payload.title}`);
      return { sent: false, reason: 'no_token' };
    }

    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) {
      this.logger.log(
        `[FCM stub] → ${user.phone}: ${payload.title} — ${payload.body}`,
      );
      return { sent: false, reason: 'firebase_not_configured', token: user.fcmToken };
    }

    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.fcmToken,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
          priority: 'high',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`FCM send failed: ${text}`);
        return { sent: false, reason: 'fcm_error' };
      }
      return { sent: true };
    } catch (e) {
      this.logger.error(`FCM error: ${e}`);
      return { sent: false, reason: 'fcm_exception' };
    }
  }

  async notifyBookingParties(input: {
    customerId: string;
    providerUserId: string;
    status: string;
    serviceName: string;
  }) {
    const title = 'ZANA booking update';
    const body = `${input.serviceName} is now ${input.status.replaceAll('_', ' ')}`;
    await Promise.all([
      this.notifyUser(input.customerId, {
        title,
        body,
        data: { type: 'booking', status: input.status },
      }),
      this.notifyUser(input.providerUserId, {
        title,
        body,
        data: { type: 'booking', status: input.status },
      }),
    ]);
  }
}
