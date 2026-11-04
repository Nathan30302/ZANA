import { NextResponse } from "next/server";
import { BookingStatus, FloatTxnType } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "DECLINED",
    "CANCELLED",
    "IN_PROGRESS",
    "COMPLETED",
  ]),
});

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      professional: { include: { user: { select: { phone: true, name: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
      review: true,
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  const allowed =
    booking.customerId === session.id ||
    (pro && pro.id === booking.professionalId) ||
    session.role === "ADMIN";
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ booking });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { professional: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  const isPro = pro && pro.id === booking.professionalId;
  const isCustomer = booking.customerId === session.id;
  const next = parsed.data.status as BookingStatus;

  if (next === BookingStatus.CANCELLED && !(isCustomer || isPro || session.role === "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const proOnlyStatuses: BookingStatus[] = [
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
  ];
  if (proOnlyStatuses.includes(next) && !isPro && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only professional can update this status" }, { status: 403 });
  }

  if (next === BookingStatus.COMPLETED && booking.status !== BookingStatus.COMPLETED) {
    const settings = await getSettings();
    const commission = booking.commissionZmw;
    if (booking.professional.floatBalanceZmw < commission) {
      return NextResponse.json(
        { error: `Insufficient float. Top up at least K${settings.minFloatZmw}` },
        { status: 409 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: { status: BookingStatus.COMPLETED },
        include: { service: true, professional: true, customer: true },
      });
      const newBal = booking.professional.floatBalanceZmw - commission;
      await tx.professionalProfile.update({
        where: { id: booking.professionalId },
        data: { floatBalanceZmw: newBal },
      });
      await tx.floatTransaction.create({
        data: {
          userId: booking.professional.userId,
          type: FloatTxnType.COMMISSION,
          amountZmw: -commission,
          balanceAfter: newBal,
          note: `Commission on booking ${booking.id}`,
          bookingId: booking.id,
        },
      });
      return b;
    });

    return NextResponse.json({ booking: updated });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: next },
    include: { service: true, professional: true, customer: true, review: true },
  });

  return NextResponse.json({ booking: updated });
}
