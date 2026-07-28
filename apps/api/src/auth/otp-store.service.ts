import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_MS = 30 * 1000;

@Injectable()
export class OtpStore {
  constructor(private readonly prisma: PrismaService) {}

  async save(phone: string, code: string) {
    const existing = await this.prisma.otpChallenge.findUnique({
      where: { phone },
    });
    if (
      existing &&
      Date.now() - existing.updatedAt.getTime() < MIN_RESEND_MS
    ) {
      // Allow reuse of current code within resend window (avoids spam)
      return existing.code;
    }

    const expiresAt = new Date(Date.now() + TTL_MS);
    const row = await this.prisma.otpChallenge.upsert({
      where: { phone },
      create: { phone, code, expiresAt },
      update: { code, expiresAt },
    });
    return row.code;
  }

  async consume(phone: string, code: string): Promise<boolean> {
    const row = await this.prisma.otpChallenge.findUnique({ where: { phone } });
    if (!row) return false;
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.otpChallenge.delete({ where: { phone } }).catch(() => {});
      return false;
    }
    if (row.code !== code) return false;
    await this.prisma.otpChallenge.delete({ where: { phone } }).catch(() => {});
    return true;
  }
}
