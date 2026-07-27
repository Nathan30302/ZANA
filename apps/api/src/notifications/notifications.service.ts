import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * FCM push stub. When FIREBASE_SERVER_KEY / GOOGLE_APPLICATION_CREDENTIALS
 * are set, swap send() to firebase-admin messaging. Until then we log.
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

    if (!process.env.FIREBASE_SERVER_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      this.logger.log(
        `[FCM stub] → ${user.phone}: ${payload.title} — ${payload.body}`,
      );
      return { sent: false, reason: 'firebase_not_configured', token: user.fcmToken };
    }

    // Production hook: use firebase-admin here
    this.logger.log(`[FCM] would send to ${user.fcmToken.slice(0, 12)}… ${payload.title}`);
    return { sent: true };
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
