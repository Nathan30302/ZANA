import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

/** Dev OTP auth. Swap for Firebase / Africa's Talking in production. */
@Injectable()
export class AuthService {
  private readonly codes = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  requestOtp(phone: string) {
    const normalized = this.normalizePhone(phone);
    const code = process.env.OTP_DEV_CODE || '123456';
    this.codes.set(normalized, code);
    return {
      phone: normalized,
      message: 'OTP sent',
      // Exposed only when OTP_DEV_CODE is set (local/dev)
      ...(process.env.OTP_DEV_CODE ? { devCode: code } : {}),
    };
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const normalized = this.normalizePhone(phone);
    const expected = this.codes.get(normalized) || process.env.OTP_DEV_CODE;
    if (!expected || code !== expected) {
      throw new UnauthorizedException('Invalid OTP');
    }
    this.codes.delete(normalized);

    const user = await this.prisma.user.upsert({
      where: { phone: normalized },
      update: name ? { name } : {},
      create: {
        phone: normalized,
        name: name ?? null,
        role: UserRole.CUSTOMER,
      },
      include: { providerProfile: true },
    });

    // Simple opaque token for MVP scaffolding (replace with JWT)
    const token = Buffer.from(`${user.id}:${user.phone}`).toString('base64url');
    return { token, user };
  }

  async userFromToken(token?: string) {
    if (!token) return null;
    const raw = token.replace(/^Bearer\s+/i, '');
    try {
      const decoded = Buffer.from(raw, 'base64url').toString('utf8');
      const [id] = decoded.split(':');
      return this.prisma.user.findUnique({
        where: { id },
        include: { providerProfile: true },
      });
    } catch {
      return null;
    }
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\s+/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('260')) return `+${digits}`;
    if (digits.startsWith('0')) return `+260${digits.slice(1)}`;
    return `+260${digits}`;
  }
}
