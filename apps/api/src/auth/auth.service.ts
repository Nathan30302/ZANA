import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_PROVIDER, type OtpProvider } from './otp.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_PROVIDER) private readonly otp: OtpProvider,
  ) {}

  async requestOtp(phone: string) {
    const normalized = this.normalizePhone(phone);
    return this.otp.send(normalized);
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const normalized = this.normalizePhone(phone);
    const ok = await this.otp.consume(normalized, code);
    if (!ok) throw new UnauthorizedException('Invalid OTP');

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

    const token = Buffer.from(`${user.id}:${user.phone}`).toString('base64url');
    return { token, user };
  }

  async registerFcmToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
      select: { id: true, fcmToken: true },
    });
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

  normalizePhone(phone: string) {
    const digits = phone.replace(/\s+/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('260')) return `+${digits}`;
    if (digits.startsWith('0')) return `+260${digits.slice(1)}`;
    return `+260${digits}`;
  }
}
