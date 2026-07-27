import { Injectable, NotFoundException } from '@nestjs/common';
import {
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
