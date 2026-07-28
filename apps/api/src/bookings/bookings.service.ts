import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
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
  CONFIRMED: [BookingStatus.IN_SERVICE, BookingStatus.CANCELLED],
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

function maskPhone(phone?: string | null) {
  if (!phone || phone.length < 6) return phone ?? null;
  return `${phone.slice(0, 5)}***${phone.slice(-2)}`;
}

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    service: true;
    provider: { include: { user: true } };
    customer: true;
    review: true;
  };
}>;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private serialize(
    booking: BookingWithRelations,
    viewerId: string,
  ): Record<string, unknown> {
    const isCustomer = booking.customerId === viewerId;
    const isProvider = booking.provider.userId === viewerId;
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

    const { provider, customer, ...rest } = booking;
    const { user: _user, ...providerPublic } = provider;

    return {
      ...rest,
      customerAddress,
      contactPhone,
      provider: providerPublic,
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

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        providerId: input.providerId,
        serviceId: input.serviceId,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        customerLat: input.customerLat,
        customerLng: input.customerLng,
        customerAddress: input.customerAddress,
        notes: input.notes,
        priceZmw: service.priceZmw,
        contactPhone: null,
        status: BookingStatus.REQUESTED,
      },
      include: {
        service: true,
        provider: { include: { user: true } },
        customer: true,
        review: true,
      },
    });

    await this.notifications.notifyUser(service.provider.userId, {
      title: 'New ZANA job',
      body: `${service.name} requested`,
      data: { type: 'booking', bookingId: booking.id },
    });

    return this.serialize(booking, customerId);
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
    const where: Prisma.BookingWhereInput =
      role === 'customer'
        ? { customerId: userId }
        : { provider: { userId } };
    const rows = await this.prisma.booking.findMany({
      where,
      include: {
        service: true,
        provider: { include: { user: true } },
        customer: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((b) => this.serialize(b, userId));
  }

  async getForUser(bookingId: string, userId: string) {
    await this.expireStaleRequested();
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        provider: { include: { user: true } },
        customer: true,
        review: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (
      booking.customerId !== userId &&
      booking.provider.userId !== userId
    ) {
      throw new ForbiddenException();
    }
    return this.serialize(booking, userId);
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
    if (booking.provider.userId !== providerUserId) {
      throw new ForbiddenException();
    }
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { providerLat: lat, providerLng: lng },
      include: {
        service: true,
        provider: { include: { user: true } },
        customer: true,
        review: true,
      },
    });
    return this.serialize(updated, providerUserId);
  }

  async transition(
    bookingId: string,
    actor: { id: string; isProvider: boolean },
    next: BookingStatus,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { include: { user: true } },
        service: true,
        customer: true,
        review: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isOwnerCustomer = booking.customerId === actor.id;
    const isOwnerProvider = booking.provider.userId === actor.id;
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

    let updated: BookingWithRelations;

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
          include: {
            service: true,
            provider: { include: { user: true } },
            customer: true,
            review: true,
          },
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
          data: { status: next, creditBurned: false },
          include: {
            service: true,
            provider: { include: { user: true } },
            customer: true,
            review: true,
          },
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
        },
        include: {
          service: true,
          provider: { include: { user: true } },
          customer: true,
          review: true,
        },
      });
    }

    await this.notifications.notifyBookingParties({
      customerId: booking.customerId,
      providerUserId: booking.provider.userId,
      status: next,
      serviceName: booking.service.name,
    });

    return this.serialize(updated, actor.id);
  }
}
