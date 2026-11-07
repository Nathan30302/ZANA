import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  if (!pro) return NextResponse.json({ error: "Not a professional" }, { status: 404 });
  const services = await prisma.service.findMany({
    where: { professionalId: pro.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ services });
}

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  durationMin: z.number().int().positive(),
  priceZmw: z.number().int().positive(),
  homeEligible: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  if (!pro) return NextResponse.json({ error: "Not a professional" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid service" }, { status: 400 });

  const service = await prisma.service.create({
    data: { ...parsed.data, professionalId: pro.id },
  });
  return NextResponse.json({ service }, { status: 201 });
}
