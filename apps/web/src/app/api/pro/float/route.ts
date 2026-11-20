import { NextResponse } from "next/server";
import { FloatTxnType } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  if (!pro) return NextResponse.json({ error: "Not a professional" }, { status: 404 });

  const transactions = await prisma.floatTransaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    balanceZmw: pro.floatBalanceZmw,
    transactions,
  });
}

const topUpSchema = z.object({
  amountZmw: z.number().int().min(50).max(5000),
  provider: z.enum(["MTN", "AIRTEL", "CARD"]).default("MTN"),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = topUpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const pro = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  if (!pro) return NextResponse.json({ error: "Not a professional" }, { status: 404 });

  // Stub mobile money / Flutterwave — mark success immediately in demo
  const newBal = pro.floatBalanceZmw + parsed.data.amountZmw;
  const [updated, txn] = await prisma.$transaction([
    prisma.professionalProfile.update({
      where: { id: pro.id },
      data: { floatBalanceZmw: newBal },
    }),
    prisma.floatTransaction.create({
      data: {
        userId: session.id,
        type: FloatTxnType.TOP_UP,
        amountZmw: parsed.data.amountZmw,
        balanceAfter: newBal,
        note: `Top-up via ${parsed.data.provider} (demo)`,
      },
    }),
  ]);

  return NextResponse.json({
    balanceZmw: updated.floatBalanceZmw,
    transaction: txn,
    payment: { status: "SUCCESS", provider: parsed.data.provider },
  });
}
