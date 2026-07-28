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

  listApplications(status?: ProviderApplicationStatus, q?: string) {
    const query = q?.trim();
    return this.prisma.providerApplication.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { displayName: { contains: query, mode: 'insensitive' } },
                { area: { contains: query, mode: 'insensitive' } },
                { user: { phone: { contains: query } } },
              ],
            }
          : {}),
      },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  getMyApplication(userId: string) {
    return this.prisma.providerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resubmitApplication(
    userId: string,
    input: {
      type?: ProviderType;
      displayName?: string;
      area?: string;
      notes?: string;
      documentUrls?: string[];
    },
  ) {
    const app = await this.prisma.providerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!app) throw new NotFoundException('No application found');
    if (
      app.status !== ProviderApplicationStatus.NEEDS_INFO &&
      app.status !== ProviderApplicationStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot resubmit while status is ${app.status}`,
      );
    }

    return this.prisma.providerApplication.update({
      where: { id: app.id },
      data: {
        status: ProviderApplicationStatus.PENDING,
        adminNote: null,
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.documentUrls !== undefined
          ? { documentUrls: input.documentUrls }
          : {}),
      },
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

  listBookings(status?: BookingStatus, q?: string) {
    const query = q?.trim();
    return this.prisma.booking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { service: { name: { contains: query, mode: 'insensitive' } } },
                {
                  provider: {
                    displayName: { contains: query, mode: 'insensitive' },
                  },
                },
                { customer: { phone: { contains: query } } },
                { disputeNote: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        service: true,
        provider: { select: { id: true, displayName: true, area: true } },
        customer: { select: { id: true, phone: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async setDisputeNote(bookingId: string, disputeNote: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { disputeNote: disputeNote.trim() || null },
      include: {
        service: true,
        provider: { select: { id: true, displayName: true, area: true } },
        customer: { select: { id: true, phone: true, name: true } },
      },
    });
  }

  async forceBookingStatus(
    bookingId: string,
    status: BookingStatus,
    opts: { refundCredit?: boolean; note?: string } = {},
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    let creditBurned = booking.creditBurned;
    if (
      opts.refundCredit &&
      booking.creditBurned &&
      (status === BookingStatus.CANCELLED ||
        status === BookingStatus.DECLINED ||
        status === BookingStatus.EXPIRED)
    ) {
      await this.prisma.providerProfile.update({
        where: { id: booking.providerId },
        data: { creditBalance: { increment: 1 } },
      });
      creditBurned = false;
    }

    const note = opts.note?.trim();
    const disputeNote = note
      ? [booking.disputeNote?.trim(), `[admin] ${note}`].filter(Boolean).join('\n')
      : booking.disputeNote;

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status, creditBurned, disputeNote },
      include: {
        service: true,
        provider: { select: { id: true, displayName: true, area: true } },
        customer: { select: { id: true, phone: true, name: true } },
      },
    });
  }

  async adjustProviderCredits(providerId: string, delta: number, note?: string) {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestException('delta must be a non-zero number');
    }
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    const next = Math.max(0, provider.creditBalance + Math.trunc(delta));
    return this.prisma.providerProfile.update({
      where: { id: providerId },
      data: { creditBalance: next },
      select: {
        id: true,
        displayName: true,
        creditBalance: true,
        area: true,
      },
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
