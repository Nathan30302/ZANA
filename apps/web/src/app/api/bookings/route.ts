import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, LocationType, ProStatus, Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { calcTotals, getSettings } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  professionalId: z.string(),
  serviceId: z.string(),
  scheduledAt: z.string(),
  locationType: z.enum(["AT_HOME", "AT_SHOP"]),
  address: z.string().optional(),
  customerNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = req.nextUrl.searchParams.get("scope") || "customer";

  if (scope === "pro") {
    const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
    if (!pro) return NextResponse.json({ bookings: [] });
    const bookings = await prisma.booking.findMany({
      where: { professionalId: pro.id },
      orderBy: { scheduledAt: "desc" },
      include: {
        service: true,
        customer: { select: { id: true, name: true, phone: true } },
        review: true,
      },
    });
    return NextResponse.json({ bookings });
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.id },
    orderBy: { scheduledAt: "desc" },
    include: {
      service: true,
      professional: true,
      review: true,
    },
  });
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }

  const pro = await prisma.professionalProfile.findUnique({
    where: { id: parsed.data.professionalId },
    include: { services: true },
  });
  if (!pro || pro.status !== ProStatus.APPROVED) {
    return NextResponse.json({ error: "Professional unavailable" }, { status: 400 });
  }

  const service = pro.services.find((s) => s.id === parsed.data.serviceId && s.active);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 400 });

  const locationType =
    parsed.data.locationType === "AT_HOME" ? LocationType.AT_HOME : LocationType.AT_SHOP;

  if (locationType === LocationType.AT_HOME) {
    if (!pro.homeService || !service.homeEligible) {
      return NextResponse.json({ error: "Home service not available" }, { status: 400 });
    }
    if (!parsed.data.address?.trim()) {
      return NextResponse.json({ error: "Address required for home service" }, { status: 400 });
    }
  }

  const settings = await getSettings();
  const totals = calcTotals({
    servicePriceZmw: service.priceZmw,
    travelFeeZmw: pro.travelFeeZmw,
    locationType,
    commissionPercent: settings.commissionPercent,
    homeCommissionPercent: settings.homeCommissionPercent,
  });

  if (pro.floatBalanceZmw < totals.commissionZmw) {
    return NextResponse.json(
      { error: "Professional float too low to accept new bookings right now" },
      { status: 409 },
    );
  }

  const booking = await prisma.booking.create({
    data: {
      customerId: session.id,
      professionalId: pro.id,
      serviceId: service.id,
      status: BookingStatus.REQUESTED,
      locationType,
      address: locationType === LocationType.AT_HOME ? parsed.data.address : pro.address,
      scheduledAt: new Date(parsed.data.scheduledAt),
      servicePriceZmw: service.priceZmw,
      travelFeeZmw: totals.travelFeeZmw,
      commissionZmw: totals.commissionZmw,
      customerNote: parsed.data.customerNote || null,
    },
    include: { service: true, professional: true },
  });

  // Ensure customer role if they booked
  if (session.role === Role.ADMIN) {
    /* allow */
  }

  return NextResponse.json({ booking }, { status: 201 });
}
