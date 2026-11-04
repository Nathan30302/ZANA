import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid location" }, { status: 400 });

  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  if (!pro) return NextResponse.json({ error: "Not a professional" }, { status: 404 });

  const updated = await prisma.professionalProfile.update({
    where: { id: pro.id },
    data: {
      liveLat: parsed.data.lat,
      liveLng: parsed.data.lng,
      liveUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({
    lat: updated.liveLat,
    lng: updated.liveLng,
    liveUpdatedAt: updated.liveUpdatedAt,
  });
}
