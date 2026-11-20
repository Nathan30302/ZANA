import { NextResponse } from "next/server";
import { BookingStatus, ProStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [customers, pros, pending, bookings, completed, gmv] = await Promise.all([
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.professionalProfile.count({ where: { status: ProStatus.APPROVED } }),
    prisma.professionalProfile.count({ where: { status: ProStatus.PENDING } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { servicePriceZmw: true, travelFeeZmw: true, commissionZmw: true },
    }),
  ]);

  const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } });

  return NextResponse.json({
    stats: {
      customers,
      professionals: pros,
      pendingApplications: pending,
      bookings,
      completedBookings: completed,
      gmvZmw: (gmv._sum.servicePriceZmw || 0) + (gmv._sum.travelFeeZmw || 0),
      commissionZmw: gmv._sum.commissionZmw || 0,
    },
    settings,
  });
}
