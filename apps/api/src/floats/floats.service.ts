import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY';

@Injectable()
export class FloatsService {
  constructor(private readonly prisma: PrismaService) {}

  listPackages() {
    return this.prisma.floatPackage.findMany({
      where: { isActive: true },
      orderBy: { credits: 'asc' },
    });
  }

  async purchase(
    userId: string,
    packageId: string,
    input: { method?: PaymentMethod; phone?: string; simulate?: boolean } = {},
  ) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const pkg = await this.prisma.floatPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) throw new NotFoundException('Float package not found');

    const method = input.method ?? 'MTN_MOMO';
    if (method !== 'MTN_MOMO' && method !== 'AIRTEL_MONEY') {
      throw new BadRequestException('method must be MTN_MOMO or AIRTEL_MONEY');
    }

    const payerPhone = input.phone ?? '+26097XXXXXXX';
    const providerRef = `${method}-${Date.now()}`;

    // Create PENDING MoMo/Airtel charge — webhook confirms later
    const purchase = await this.prisma.floatPurchase.create({
      data: {
        providerId: profile.id,
        packageId: pkg.id,
        credits: pkg.credits,
        amountZmw: pkg.priceZmw,
        status: 'PENDING',
        providerRef,
      },
    });

    const instructions =
      method === 'MTN_MOMO'
        ? `Approve MTN MoMo prompt on ${payerPhone} for K${pkg.priceZmw}`
        : `Approve Airtel Money prompt on ${payerPhone} for K${pkg.priceZmw}`;

    // Dev/sim: auto-confirm when simulate=true (default in OTP_DEV environments)
    const shouldSimulate =
      input.simulate === true ||
      (input.simulate !== false && !!process.env.OTP_DEV_CODE);

    if (shouldSimulate) {
      const confirmed = await this.confirmPurchase(purchase.id);
      return {
        ...confirmed,
        payment: {
          method,
          status: 'COMPLETED',
          instructions: `${instructions} (simulated success)`,
        },
      };
    }

    return {
      purchase,
      creditBalance: profile.creditBalance,
      payment: {
        method,
        status: 'PENDING',
        instructions,
        next: 'POST /v1/floats/webhook/confirm with { purchaseId } after payer approves',
      },
    };
  }

  async confirmPurchase(purchaseId: string) {
    const purchase = await this.prisma.floatPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status === 'COMPLETED') {
      const profile = await this.prisma.providerProfile.findUnique({
        where: { id: purchase.providerId },
      });
      return { purchase, creditBalance: profile?.creditBalance ?? 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPurchase = await tx.floatPurchase.update({
        where: { id: purchaseId },
        data: { status: 'COMPLETED' },
      });
      const updated = await tx.providerProfile.update({
        where: { id: purchase.providerId },
        data: { creditBalance: { increment: purchase.credits } },
      });
      return { purchase: updatedPurchase, creditBalance: updated.creditBalance };
    });
  }

  async balance(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      select: { creditBalance: true, displayName: true },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }
}
