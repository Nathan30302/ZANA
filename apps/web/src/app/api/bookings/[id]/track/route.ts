import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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

  const straightKm = haversineKm(proPin, customer);
  let route: { coordinates: [number, number][]; distanceKm: number; durationMin: number } | null = null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${proPin.lng},${proPin.lat};${customer.lng},${customer.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const r = data.routes?.[0];
      if (r) {
        route = {
          coordinates: (r.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
          distanceKm: r.distance / 1000,
          durationMin: Math.max(1, Math.round(r.duration / 60)),
        };
      }
    }
  } catch {
    route = null;
  }

  return NextResponse.json({
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
      },
    },
    customer,
    pro: proPin,
    live: Boolean(fresh),
    distanceKm: route?.distanceKm ?? straightKm,
    etaMin: route?.durationMin ?? driveMinutes(straightKm),
    route: route?.coordinates ?? [],
  });
}
