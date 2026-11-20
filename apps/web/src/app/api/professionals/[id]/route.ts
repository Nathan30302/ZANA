import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const professional = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      services: { where: { active: true }, orderBy: { priceZmw: "asc" } },
      portfolio: { orderBy: { createdAt: "desc" } },
      hours: { orderBy: { dayOfWeek: "asc" } },
      user: { select: { id: true, phone: true, name: true, avatarUrl: true } },
      bookings: {
        where: { status: "COMPLETED", review: { isNot: null } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          review: true,
          customer: { select: { name: true } },
          service: true,
        },
      },
    },
  });

  if (!professional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ professional });
}
