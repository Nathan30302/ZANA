import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { professional: true, review: true },
  });
  if (!booking || booking.status !== BookingStatus.COMPLETED) {
    return NextResponse.json({ error: "Booking not reviewable" }, { status: 400 });
  }
  if (booking.customerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.review) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      fromUserId: session.id,
      toUserId: booking.professional.userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { toUserId: booking.professional.userId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.professionalProfile.update({
    where: { id: booking.professionalId },
    data: {
      ratingAvg: Number(agg._avg.rating?.toFixed(2) || 0),
      ratingCount: agg._count.rating,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
