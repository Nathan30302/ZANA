import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    bookingId: string,
    input: { rating: number; comment?: string; photoUrl?: string },
  ) {
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be 1–5');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, provider: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenException();
    if (
      booking.status !== BookingStatus.COMPLETED &&
      booking.status !== BookingStatus.RATED
    ) {
      throw new BadRequestException('Booking must be completed before review');
    }
    if (booking.review) {
      throw new BadRequestException('Booking already reviewed');
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId,
          userId,
          rating: input.rating,
          comment: input.comment,
          photoUrl: input.photoUrl,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.RATED },
      });

      const agg = await tx.review.aggregate({
        where: { booking: { providerId: booking.providerId } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          ratingAvg: agg._avg.rating ?? input.rating,
          ratingCount: agg._count.rating,
        },
      });

      return review;
    });
  }

  listForProvider(providerId: string) {
    return this.prisma.review.findMany({
      where: { booking: { providerId } },
      include: {
        user: { select: { id: true, name: true } },
        booking: { select: { id: true, serviceId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
