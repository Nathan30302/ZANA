import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  ProviderApplicationStatus,
  ProviderType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listApplications(status?: ProviderApplicationStatus) {
    return this.prisma.providerApplication.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(
    applicationId: string,
    status: ProviderApplicationStatus,
    adminNote?: string,
  ) {
    const app = await this.prisma.providerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');

    if (status === ProviderApplicationStatus.NEEDS_INFO) {
      if (!adminNote?.trim()) {
        throw new BadRequestException('adminNote required for NEEDS_INFO');
      }
      return this.prisma.providerApplication.update({
        where: { id: applicationId },
        data: { status, adminNote },
      });
    }

    if (status !== ProviderApplicationStatus.APPROVED) {
      return this.prisma.providerApplication.update({
        where: { id: applicationId },
        data: { status, adminNote },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.providerApplication.update({
        where: { id: applicationId },
        data: { status, adminNote },
      });

      await tx.user.update({
        where: { id: app.userId },
        data: { role: UserRole.PROVIDER },
      });

      await tx.providerProfile.upsert({
        where: { userId: app.userId },
        update: {
          displayName: app.displayName,
          type: app.type,
          area: app.area,
          isVerified: true,
        },
        create: {
          userId: app.userId,
          displayName: app.displayName,
          type: app.type,
          area: app.area,
          isVerified: true,
          creditBalance: 0,
        },
      });

      return updated;
    });
  }

  async submitApplication(
    userId: string,
    input: {
      type: ProviderType;
      displayName: string;
      area: string;
      notes?: string;
      documentUrls?: string[];
    },
  ) {
    return this.prisma.providerApplication.create({
      data: {
        userId,
        type: input.type,
        displayName: input.displayName,
        area: input.area,
        notes: input.notes,
        documentUrls: input.documentUrls ?? [],
      },
    });
  }

  listBookings(status?: BookingStatus) {
    return this.prisma.booking.findMany({
      where: status ? { status } : undefined,
      include: {
        service: true,
        provider: { select: { id: true, displayName: true, area: true } },
        customer: { select: { id: true, phone: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listFloatPackages() {
    return this.prisma.floatPackage.findMany({ orderBy: { credits: 'asc' } });
  }

  createFloatPackage(input: {
    code: string;
    name: string;
    credits: number;
    priceZmw: number;
    isActive?: boolean;
  }) {
    if (!input.code?.trim() || !input.name?.trim()) {
      throw new BadRequestException('code and name required');
    }
    return this.prisma.floatPackage.create({
      data: {
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        credits: input.credits,
        priceZmw: input.priceZmw,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateFloatPackage(
    id: string,
    input: Partial<{
      name: string;
      credits: number;
      priceZmw: number;
      isActive: boolean;
    }>,
  ) {
    const existing = await this.prisma.floatPackage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Package not found');
    return this.prisma.floatPackage.update({
      where: { id },
      data: input,
    });
  }

  stats() {
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.providerProfile.count({ where: { isVerified: true } }),
      this.prisma.booking.count(),
      this.prisma.providerApplication.count({
        where: { status: ProviderApplicationStatus.PENDING },
      }),
    ]).then(([users, providers, bookings, pendingApps]) => ({
      users,
      providers,
      bookings,
      pendingApps,
    }));
  }
}
