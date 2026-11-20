import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadAllowed(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
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
    },
  });
  if (!conversation) return null;
  if (conversation.customerId !== userId && conversation.proUserId !== userId) return null;
  return conversation;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const conversation = await loadAllowed(id, session.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({ conversation, messages });
}

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const conversation = await loadAllowed(id, session.id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.id,
      body: parsed.data.body.trim(),
    },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
