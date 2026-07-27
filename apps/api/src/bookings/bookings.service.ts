import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, input: {
    providerId: string;
    serviceId: string;
    scheduledAt?: string;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    notes?: string;
  }) {
    const service = await this.prisma.service.findFirst({
      where: { id: input.serviceId, providerId: input.providerId, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.booking.create({
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
        status: BookingStatus.REQUESTED,
      },
      include: { service: true, provider: true },
    });
  }

  listForUser(userId: string, role: 'customer' | 'provider') {
    const where: Prisma.BookingWhereInput =
      role === 'customer'
        ? { customerId: userId }
        : { provider: { userId } };
    return this.prisma.booking.findMany({
      where,
      include: {
        service: true,
        provider: true,
        customer: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForUser(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        provider: true,
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
    return booking;
  }

  async transition(
    bookingId: string,
    actor: { id: string; isProvider: boolean },
    next: BookingStatus,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
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

    // Only providers accept/decline/progress; customers cancel or rate
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
    if (next === BookingStatus.CANCELLED && !isOwnerCustomer && !isOwnerProvider) {
      throw new ForbiddenException();
    }
    if (next === BookingStatus.RATED && !isOwnerCustomer) {
      throw new ForbiddenException('Customer rates after completion');
    }

    // Burn one float credit on accept
    if (next === BookingStatus.ACCEPTED && !booking.creditBurned) {
      if (booking.provider.creditBalance < 1) {
        throw new BadRequestException('Insufficient float credits');
      }
      return this.prisma.$transaction(async (tx) => {
        await tx.providerProfile.update({
          where: { id: booking.providerId },
          data: { creditBalance: { decrement: 1 } },
        });
        return tx.booking.update({
          where: { id: bookingId },
          data: { status: next, creditBurned: true },
          include: { service: true, provider: true, customer: true },
        });
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: next },
      include: { service: true, provider: true, customer: true },
    });
  }
}
