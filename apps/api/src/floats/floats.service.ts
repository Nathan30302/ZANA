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
    const profile = await this.resolveShopProfile(userId);
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
      const result = await this.payments.confirm(purchase.providerRef);
      if (result.status === 'PENDING') {
        return {
          purchase,
          creditBalance: (
            await this.prisma.providerProfile.findUnique({
              where: { id: purchase.providerId },
            })
          )?.creditBalance ?? 0,
          payment: { status: 'PENDING' },
        };
      }
      if (result.status === 'FAILED') {
        const failed = await this.prisma.floatPurchase.update({
          where: { id: purchaseId },
          data: { status: 'FAILED' },
        });
        const profile = await this.prisma.providerProfile.findUnique({
          where: { id: purchase.providerId },
        });
        return {
          purchase: failed,
          creditBalance: profile?.creditBalance ?? 0,
          payment: { status: 'FAILED' },
        };
      }
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
          payment: { status: existing?.status ?? 'COMPLETED' },
        };
      }
      const updatedPurchase = await tx.floatPurchase.findUniqueOrThrow({
        where: { id: purchaseId },
      });
      const updated = await tx.providerProfile.update({
        where: { id: purchase.providerId },
        data: { creditBalance: { increment: purchase.credits } },
      });
      return {
        purchase: updatedPurchase,
        creditBalance: updated.creditBalance,
        payment: { status: 'COMPLETED' },
      };
    });
  }

  async balance(userId: string) {
    const profile = await this.resolveShopProfile(userId);
    if (!profile) throw new NotFoundException('Provider profile not found');
    return {
      creditBalance: profile.creditBalance,
      displayName: profile.displayName,
      shared: profile.userId !== userId,
    };
  }

  /** Owner shop, or first staff membership shop (shared team float). */
  private async resolveShopProfile(userId: string) {
    const owned = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (owned) return owned;

    const staff = await this.prisma.staffMembership.findFirst({
      where: { userId },
      include: { provider: { include: { user: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return staff?.provider ?? null;
  }
}
