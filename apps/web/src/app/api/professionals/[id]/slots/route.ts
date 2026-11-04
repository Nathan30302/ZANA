import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const date = req.nextUrl.searchParams.get("date");
  const serviceId = req.nextUrl.searchParams.get("serviceId");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  let durationMin = 60;
  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (service) durationMin = service.durationMin;
  }

  const slots = await getAvailableSlots(id, date, durationMin);
  return NextResponse.json({ slots });
}
