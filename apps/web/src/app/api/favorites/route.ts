import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const ids = favorites.map((f) => f.professionalId);
  const professionals = await prisma.professionalProfile.findMany({
    where: { id: { in: ids } },
    include: { services: { where: { active: true }, orderBy: { priceZmw: "asc" } } },
  });

  return NextResponse.json({ favorites: professionals });
}

const schema = z.object({ professionalId: z.string() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.favorite.upsert({
    where: {
      userId_professionalId: {
        userId: session.id,
        professionalId: parsed.data.professionalId,
      },
    },
    create: { userId: session.id, professionalId: parsed.data.professionalId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: session.id, professionalId: parsed.data.professionalId },
  });
  return NextResponse.json({ ok: true });
}
