import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ServiceMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: [
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.CANCELLED,
    BookingStatus.EXPIRED,
  ],
  ACCEPTED: [
    BookingStatus.ON_THE_WAY,
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
  ],
  ON_THE_WAY: [BookingStatus.IN_SERVICE, BookingStatus.CANCELLED],
  // CONFIRMED = at-shop arrived; allow ON_THE_WAY if pro then goes mobile
  CONFIRMED: [
    BookingStatus.IN_SERVICE,
    BookingStatus.ON_THE_WAY,
    BookingStatus.CANCELLED,
  ],
  IN_SERVICE: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  COMPLETED: [BookingStatus.RATED],
  DECLINED: [],
  CANCELLED: [],
  EXPIRED: [],
  RATED: [],
};

const ACCEPTED_OR_LATER: BookingStatus[] = [
  BookingStatus.ACCEPTED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_SERVICE,
  BookingStatus.COMPLETED,
  BookingStatus.RATED,
];

const ACTIVE_OVERLAP: BookingStatus[] = [
  BookingStatus.REQUESTED,
  BookingStatus.ACCEPTED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_SERVICE,
];

/** Africa/Lusaka is UTC+2 year-round (no DST). */
const LUSAKA_OFFSET_MS = 2 * 60 * 60 * 1000;

function maskPhone(phone?: string | null) {
  if (!phone || phone.length < 6) return phone ?? null;
  return `${phone.slice(0, 5)}***${phone.slice(-2)}`;
}

function lusakaDayBounds(dateIso?: string): { start: Date; end: Date; date: string } {
  let y: number;
  let m: number;
  let d: number;
  if (dateIso) {
    const mParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
    if (!mParts) throw new BadRequestException('date must be YYYY-MM-DD');
    y = Number(mParts[1]);
    m = Number(mParts[2]);
    d = Number(mParts[3]);
  } else {
    const nowLusaka = new Date(Date.now() + LUSAKA_OFFSET_MS);
    y = nowLusaka.getUTCFullYear();
    m = nowLusaka.getUTCMonth() + 1;
    d = nowLusaka.getUTCDate();
  }
  // Lusaka local midnight as UTC instant
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - LUSAKA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const date = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  return { start, end, date };
}

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    service: true;
    provider: { include: { user: true } };
    customer: true;
    review: true;
    assignedStaff: { select: { id: true; name: true; phone: true } };
  };
}>;

const bookingInclude = {
  service: true,
  provider: { include: { user: true } },
  customer: true,
  review: true,
  assignedStaff: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.BookingInclude;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private serialize(
    booking: BookingWithRelations,
    viewerId: string,
    asProviderSide = false,
  ): Record<string, unknown> {
    const isCustomer = booking.customerId === viewerId;
    const isProvider =
      asProviderSide ||
      booking.provider.userId === viewerId ||
      booking.assignedStaffUserId === viewerId;
    const revealed = ACCEPTED_OR_LATER.includes(booking.status);

    let customerAddress = booking.customerAddress;
    if (isProvider && !revealed) {
      customerAddress = customerAddress
        ? 'Address shared after you accept'
        : null;
    }

    const realProviderPhone = booking.provider.user.phone;
    const contactPhone = revealed
      ? realProviderPhone
      : maskPhone(realProviderPhone);

    const { provider, customer, assignedStaff, ...rest } = booking;
    const { user: _user, ...providerPublic } = provider;

    return {
      ...rest,
      customerAddress,
      contactPhone,
      provider: providerPublic,
      assignedStaff: assignedStaff
        ? {
            id: assignedStaff.id,
            name: assignedStaff.name,
            phone: isProvider || revealed ? assignedStaff.phone : maskPhone(assignedStaff.phone),
          }
        : null,
      customer: isProvider
        ? {
            id: customer.id,
            name: customer.name,
            phone: revealed ? customer.phone : maskPhone(customer.phone),
          }
        : isCustomer
          ? { id: customer.id, name: customer.name, phone: customer.phone }
          : undefined,
    };
  }

  async create(
    customerId: string,
    input: {
      providerId: string;
      serviceId: string;
      scheduledAt?: string;
      customerLat?: number;
      customerLng?: number;
      customerAddress?: string;
      notes?: string;
    },
  ) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: input.serviceId,
        providerId: input.providerId,
        isActive: true,
      },
      include: { provider: { include: { user: true } } },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (!service.provider.isOnline) {
      throw new BadRequestException(
        'This pro is offline right now. Try again when they go online.',
      );
    }

    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }
    if (scheduledAt) {
      await this.assertNoOverlap(
        input.providerId,
        scheduledAt,
        service.durationMin,
      );
    }

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        providerId: input.providerId,
        serviceId: input.serviceId,
        scheduledAt,
        customerLat: input.customerLat,
        customerLng: input.customerLng,
        customerAddress: input.customerAddress,
        notes: input.notes,
        priceZmw: service.priceZmw,
        contactPhone: null,
        status: BookingStatus.REQUESTED,
      },
      include: bookingInclude,
    });

    await this.notifications.notifyUser(service.provider.userId, {
      title: 'New ZANA job',
      body: `${service.name} requested`,
      data: { type: 'booking', bookingId: booking.id },
    });

    return this.serialize(booking, customerId);
  }

  private async assertNoOverlap(
    providerId: string,
    scheduledAt: Date,
    durationMin: number,
    excludeBookingId?: string,
  ) {
    const windowMs = Math.max(durationMin, 30) * 60 * 1000;
    const windowStart = new Date(scheduledAt.getTime() - windowMs);
    const windowEnd = new Date(scheduledAt.getTime() + windowMs);

    const conflicts = await this.prisma.booking.findMany({
      where: {
        providerId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: ACTIVE_OVERLAP },
        scheduledAt: { gte: windowStart, lte: windowEnd },
      },
      include: { service: true },
    });

    for (const other of conflicts) {
      if (!other.scheduledAt) continue;
      const otherDur = (other.service.durationMin || 30) * 60 * 1000;
      const a0 = scheduledAt.getTime();
      const a1 = a0 + windowMs;
      const b0 = other.scheduledAt.getTime();
      const b1 = b0 + otherDur;
      if (a0 < b1 && b0 < a1) {
        throw new BadRequestException(
          'That time overlaps another booking for this pro. Pick a different slot.',
        );
      }
    }
  }

  async expireStaleRequested() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.REQUESTED,
        createdAt: { lt: cutoff },
      },
      data: { status: BookingStatus.EXPIRED },
    });
  }

  async listForUser(userId: string, role: 'customer' | 'provider') {
    await this.expireStaleRequested();
    let where: Prisma.BookingWhereInput;
    if (role === 'customer') {
      where = { customerId: userId };
    } else {
      const providerIds = await this.providerIdsForUser(userId);
      where = { providerId: { in: providerIds } };
    }
    const rows = await this.prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((b) => this.serialize(b, userId, role === 'provider'));
  }

  private async providerIdsForUser(userId: string): Promise<string[]> {
    const owned = await this.prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    const staff = await this.prisma.staffMembership.findMany({
      where: { userId },
      select: { providerId: true },
    });
    const ids = [
      ...(owned ? [owned.id] : []),
      ...staff.map((s) => s.providerId),
    ];
    return [...new Set(ids)];
  }

  async scheduleForProvider(userId: string, dateIso?: string) {
    await this.expireStaleRequested();
    const providerIds = await this.providerIdsForUser(userId);
    if (providerIds.length === 0) {
      throw new ForbiddenException('Not a provider or staff member');
    }

    const { start, end, date } = lusakaDayBounds(dateIso);

    const rows = await this.prisma.booking.findMany({
      where: {
        providerId: { in: providerIds },
        scheduledAt: { gte: start, lt: end },
        status: {
          notIn: [
            BookingStatus.CANCELLED,
            BookingStatus.DECLINED,
            BookingStatus.EXPIRED,
          ],
        },
      },
      include: bookingInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      date,
      jobs: rows.map((b) => this.serialize(b, userId, true)),
    };
  }

  async getForUser(bookingId: string, userId: string) {
    await this.expireStaleRequested();
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const providerIds = await this.providerIdsForUser(userId);
    const asProvider = providerIds.includes(booking.providerId);
    if (booking.customerId !== userId && !asProvider) {
      throw new ForbiddenException();
    }
    return this.serialize(booking, userId, asProvider);
  }

  async updateProviderLocation(
    bookingId: string,
    providerUserId: string,
    lat: number,
    lng: number,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const providerIds = await this.providerIdsForUser(providerUserId);
    if (!providerIds.includes(booking.providerId)) {
      throw new ForbiddenException();
    }
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { providerLat: lat, providerLng: lng },
      include: bookingInclude,
    });
    return this.serialize(updated, providerUserId, true);
  }

  async assignStaff(
    bookingId: string,
    actorUserId: string,
    staffUserId: string | null,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const owned = await this.prisma.providerProfile.findUnique({
      where: { userId: actorUserId },
    });
    if (!owned || owned.id !== booking.providerId) {
      throw new ForbiddenException('Only the shop owner can assign staff');
    }

    if (staffUserId) {
      const membership = await this.prisma.staffMembership.findFirst({
        where: { providerId: booking.providerId, userId: staffUserId },
      });
      const isOwnerSelf = owned.userId === staffUserId;
      if (!membership && !isOwnerSelf) {
        throw new BadRequestException('User is not staff on this shop');
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { assignedStaffUserId: staffUserId },
      include: bookingInclude,
    });
    return this.serialize(updated, actorUserId, true);
  }

  async reportDispute(
    bookingId: string,
    userId: string,
    note: string,
  ) {
    const trimmed = note?.trim();
    if (!trimmed) throw new BadRequestException('Dispute note required');

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const providerIds = await this.providerIdsForUser(userId);
    const allowed =
      booking.customerId === userId ||
      providerIds.includes(booking.providerId);
    if (!allowed) throw new ForbiddenException();

    const prefix =
      booking.customerId === userId ? '[customer]' : '[pro]';
    const existing = booking.disputeNote?.trim();
    const disputeNote = existing
      ? `${existing}\n${prefix} ${trimmed}`
      : `${prefix} ${trimmed}`;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { disputeNote },
      include: bookingInclude,
    });
    return this.serialize(
      updated,
      userId,
      providerIds.includes(booking.providerId),
    );
  }

  async transition(
    bookingId: string,
    actor: { id: string; isProvider: boolean },
    next: BookingStatus,
    extras: { declineReason?: string; cancelReason?: string } = {},
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { include: { user: true } },
        service: true,
        customer: true,
        review: true,
        assignedStaff: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isOwnerCustomer = booking.customerId === actor.id;
    const providerIds = await this.providerIdsForUser(actor.id);
    const isOwnerProvider = providerIds.includes(booking.providerId);
    if (!isOwnerCustomer && !isOwnerProvider) {
      throw new ForbiddenException();
    }

    const allowed = TRANSITIONS[booking.status] || [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot move from ${booking.status} to ${next}`,
      );
    }

    if (
      next === BookingStatus.ACCEPTED ||
      next === BookingStatus.DECLINED ||
      next === BookingStatus.ON_THE_WAY ||
      next === BookingStatus.CONFIRMED ||
      next === BookingStatus.IN_SERVICE ||
      next === BookingStatus.COMPLETED
    ) {
      if (!isOwnerProvider) throw new ForbiddenException('Provider action only');
    }
    if (
      next === BookingStatus.CANCELLED &&
      !isOwnerCustomer &&
      !isOwnerProvider
    ) {
      throw new ForbiddenException();
    }
    if (next === BookingStatus.RATED && !isOwnerCustomer) {
      throw new ForbiddenException('Customer rates after completion');
    }

    // At-shop: prefer CONFIRMED over ON_THE_WAY from ACCEPTED is fine both ways
    if (
      next === BookingStatus.ON_THE_WAY &&
      booking.service.mode === ServiceMode.AT_SHOP &&
      booking.status === BookingStatus.ACCEPTED
    ) {
      // Allow — some shops still travel to client; no hard block
    }

    let updated: BookingWithRelations;
    const cancelData =
      next === BookingStatus.CANCELLED && extras.cancelReason?.trim()
        ? { cancelReason: extras.cancelReason.trim() }
        : {};

    if (next === BookingStatus.ACCEPTED && !booking.creditBurned) {
      if (booking.provider.creditBalance < 1) {
        throw new BadRequestException('Insufficient float credits');
      }
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.providerProfile.update({
          where: { id: booking.providerId },
          data: { creditBalance: { decrement: 1 } },
        });
        return tx.booking.update({
          where: { id: bookingId },
          data: {
            status: next,
            creditBurned: true,
            providerLat: booking.provider.lat,
            providerLng: booking.provider.lng,
            contactPhone: booking.provider.user.phone,
          },
          include: bookingInclude,
        });
      });
    } else if (next === BookingStatus.CANCELLED && booking.creditBurned) {
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.providerProfile.update({
          where: { id: booking.providerId },
          data: { creditBalance: { increment: 1 } },
        });
        return tx.booking.update({
          where: { id: bookingId },
          data: { status: next, creditBurned: false, ...cancelData },
          include: bookingInclude,
        });
      });
    } else {
      updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: next,
          ...(next === BookingStatus.ACCEPTED
            ? { contactPhone: booking.provider.user.phone }
            : {}),
          ...(next === BookingStatus.DECLINED && extras.declineReason
            ? { declineReason: extras.declineReason.trim() }
            : {}),
          ...cancelData,
        },
        include: bookingInclude,
      });
    }

    await this.notifications.notifyBookingParties({
      customerId: booking.customerId,
      providerUserId: booking.provider.userId,
      status: next,
      serviceName: booking.service.name,
    });

    return this.serialize(updated, actor.id, isOwnerProvider);
  }
}
