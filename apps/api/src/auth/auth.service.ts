import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_PROVIDER, type OtpProvider } from './otp.provider';

type JwtPayload = {
  sub: string;
  phone: string;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_PROVIDER) private readonly otp: OtpProvider,
  ) {
    this.jwtSecret =
      process.env.JWT_SECRET?.trim() || 'change-me-in-production';
    if (!process.env.JWT_SECRET?.trim()) {
      // Loud local fallback — set JWT_SECRET for any real deploy.
      console.warn(
        '[auth] JWT_SECRET unset; using insecure local default. Set JWT_SECRET before deploying.',
      );
    }
  }

  async requestOtp(phone: string) {
    const normalized = this.normalizePhone(phone);
    return this.otp.send(normalized);
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const normalized = this.normalizePhone(phone);
    const ok = await this.otp.consume(normalized, code);
    if (!ok) throw new UnauthorizedException('Invalid OTP');

    const existing = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });
    const trimmedName = name?.trim();
    if (!existing && !trimmedName) {
      throw new BadRequestException('Name is required for new accounts');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: normalized },
      update: trimmedName ? { name: trimmedName } : {},
      create: {
        phone: normalized,
        name: trimmedName!,
        role: UserRole.CUSTOMER,
      },
      include: { providerProfile: true },
    });

    const token = jwt.sign(
      { sub: user.id, phone: user.phone } satisfies JwtPayload,
      this.jwtSecret,
      { expiresIn: '30d' },
    );
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
      const payload = jwt.verify(raw, this.jwtSecret) as JwtPayload;
      if (!payload?.sub) return null;
      return this.prisma.user.findUnique({
        where: { id: payload.sub },
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
