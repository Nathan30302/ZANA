import { NextResponse } from "next/server";
import { LocationType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { fetchDrivingRoute } from "@/lib/directions";
import { driveMinutes, haversineKm } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      professional: { include: { user: { select: { phone: true, name: true } } } },
      service: true,
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  const allowed =
    booking.customerId === session.id ||
    (pro && pro.id === booking.professionalId) ||
    session.role === "ADMIN";
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customer = {
    lat: booking.customerLat ?? -15.4167,
    lng: booking.customerLng ?? 28.2833,
  };
  const fresh =
    booking.professional.liveUpdatedAt &&
    Date.now() - booking.professional.liveUpdatedAt.getTime() < 2 * 60 * 1000;
  const proPin = {
    lat: (fresh ? booking.professional.liveLat : null) ?? booking.professional.lat ?? -15.42,
    lng: (fresh ? booking.professional.liveLng : null) ?? booking.professional.lng ?? 28.3,
  };

  const shop = {
    lat: booking.professional.lat ?? -15.42,
    lng: booking.professional.lng ?? 28.3,
    address: booking.professional.address,
  };
  const toShop = booking.locationType === LocationType.AT_SHOP;
  const origin = toShop ? customer : proPin;
  const destination = toShop ? { lat: shop.lat, lng: shop.lng } : customer;
  const straightKm = haversineKm(origin, destination);
  const driven = await fetchDrivingRoute(origin, destination).catch(() => null);

  return NextResponse.json({
    mode: toShop ? "TO_SHOP" : "TO_YOU",
    booking: {
      id: booking.id,
      status: booking.status,
      locationType: booking.locationType,
      address: booking.address,
      service: booking.service.name,
      professional: {
        id: booking.professional.id,
        name: booking.professional.displayName,
        phone: booking.professional.user.phone,
        address: shop.address,
      },
    },
    customer,
    pro: proPin,
    shop,
    origin,
    destination,
    live: Boolean(fresh),
    distanceKm: driven?.distanceKm ?? straightKm,
    etaMin: driven?.durationMin ?? driveMinutes(straightKm),
    route: driven?.coordinates ?? [],
    steps: driven?.steps ?? [],
  });
}
