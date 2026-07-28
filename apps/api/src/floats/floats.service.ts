import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PAYMENT_PROVIDER,
  type PaymentMethod,
  type PaymentProvider,
} from '../payments/payment.provider';

@Injectable()
export class FloatsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

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
      include: { user: true },
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

    const payerPhone = input.phone ?? profile.user.phone;

    const initiated = await this.payments.initiate({
      amountZmw: pkg.priceZmw,
      phone: payerPhone,
      method,
      reference: `float-${pkg.code}-${Date.now()}`,
      description: `ZANA ${pkg.name} float (${pkg.credits} credits)`,
      simulate: input.simulate,
    });

    const purchase = await this.prisma.floatPurchase.create({
      data: {
        providerId: profile.id,
        packageId: pkg.id,
        credits: pkg.credits,
        amountZmw: pkg.priceZmw,
        status: initiated.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        providerRef: initiated.providerRef,
      },
    });

    if (initiated.status === 'COMPLETED') {
      const updated = await this.prisma.providerProfile.update({
        where: { id: profile.id },
        data: { creditBalance: { increment: pkg.credits } },
      });
      return {
        purchase,
        creditBalance: updated.creditBalance,
        payment: {
          method,
          status: 'COMPLETED',
          instructions: initiated.instructions,
        },
      };
    }

    return {
      purchase,
      creditBalance: profile.creditBalance,
      payment: {
        method,
        status: 'PENDING',
        instructions: initiated.instructions,
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
    if (purchase.status !== 'PENDING') {
      throw new BadRequestException(`Cannot confirm status ${purchase.status}`);
    }

    if (purchase.providerRef) {
      await this.payments.confirm(purchase.providerRef);
    }

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.floatPurchase.updateMany({
        where: { id: purchaseId, status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });
      if (claimed.count === 0) {
        const existing = await tx.floatPurchase.findUnique({
          where: { id: purchaseId },
        });
        const profile = await tx.providerProfile.findUnique({
          where: { id: purchase.providerId },
        });
        return {
          purchase: existing!,
          creditBalance: profile?.creditBalance ?? 0,
        };
      }
      const updatedPurchase = await tx.floatPurchase.findUniqueOrThrow({
        where: { id: purchaseId },
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
