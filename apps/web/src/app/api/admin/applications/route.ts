import { NextResponse } from "next/server";
import { ProStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applications = await prisma.professionalProfile.findMany({
    where: { status: { in: [ProStatus.PENDING, ProStatus.REJECTED, ProStatus.APPROVED] } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { phone: true, name: true, email: true } },
      documents: true,
      services: true,
      portfolio: true,
    },
  });

  return NextResponse.json({ applications });
}
