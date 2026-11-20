import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ customerId: session.id }, { proUserId: session.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      proUser: {
        select: {
          id: true,
          name: true,
          phone: true,
          professional: { select: { id: true, displayName: true, coverUrl: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ conversations });
}

const schema = z.object({
  professionalId: z.string().optional(),
  proUserId: z.string().optional(),
  customerId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  if (parsed.data.customerId) {
    const mine = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
    if (!mine) return NextResponse.json({ error: "Only a professional can start this chat" }, { status: 403 });
    const conversation = await prisma.conversation.upsert({
      where: { customerId_proUserId: { customerId: parsed.data.customerId, proUserId: session.id } },
      create: { customerId: parsed.data.customerId, proUserId: session.id },
      update: {},
    });
    return NextResponse.json({ conversation });
  }

  let proUserId = parsed.data.proUserId;
  if (!proUserId && parsed.data.professionalId) {
    const pro = await prisma.professionalProfile.findUnique({
      where: { id: parsed.data.professionalId },
    });
    if (!pro) return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    proUserId = pro.userId;
  }
  if (!proUserId) return NextResponse.json({ error: "Missing professional" }, { status: 400 });
  if (proUserId === session.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const conversation = await prisma.conversation.upsert({
    where: { customerId_proUserId: { customerId: session.id, proUserId } },
    create: { customerId: session.id, proUserId },
    update: {},
  });

  return NextResponse.json({ conversation });
}
