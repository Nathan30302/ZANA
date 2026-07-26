import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FloatsService {
  constructor(private readonly prisma: PrismaService) {}

  listPackages() {
    return this.prisma.floatPackage.findMany({
      where: { isActive: true },
      orderBy: { credits: 'asc' },
    });
  }

  async purchase(userId: string, packageId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const pkg = await this.prisma.floatPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) throw new NotFoundException('Float package not found');

    // MVP: mark purchase COMPLETED immediately (MoMo webhook later)
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.floatPurchase.create({
        data: {
          providerId: profile.id,
          packageId: pkg.id,
          credits: pkg.credits,
          amountZmw: pkg.priceZmw,
          status: 'COMPLETED',
          providerRef: `DEV-${Date.now()}`,
        },
      });
      const updated = await tx.providerProfile.update({
        where: { id: profile.id },
        data: { creditBalance: { increment: pkg.credits } },
      });
      return { purchase, creditBalance: updated.creditBalance };
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
