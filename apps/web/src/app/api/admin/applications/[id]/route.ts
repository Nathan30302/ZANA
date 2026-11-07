import { NextResponse } from "next/server";
import { ProStatus, Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "SUSPEND"]),
  reason: z.string().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const status =
    parsed.data.action === "APPROVE"
      ? ProStatus.APPROVED
      : parsed.data.action === "REJECT"
        ? ProStatus.REJECTED
        : ProStatus.SUSPENDED;

  const professional = await prisma.professionalProfile.update({
    where: { id },
    data: {
      status,
      verified: status === ProStatus.APPROVED,
      rejectionReason: parsed.data.reason || null,
      floatBalanceZmw: status === ProStatus.APPROVED ? undefined : undefined,
    },
  });

  if (status === ProStatus.APPROVED && professional.floatBalanceZmw < 100) {
    await prisma.professionalProfile.update({
      where: { id },
      data: { floatBalanceZmw: 200 },
    });
    await prisma.floatTransaction.create({
      data: {
        userId: professional.userId,
        type: "TOP_UP",
        amountZmw: 200,
        balanceAfter: 200,
        note: "Welcome float on approval",
      },
    });
  }

  return NextResponse.json({ professional });
}
