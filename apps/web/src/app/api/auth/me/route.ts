import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      professional: {
        include: {
          services: { where: { active: true }, orderBy: { priceZmw: "asc" } },
        },
      },
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      name: typeof body.name === "string" ? body.name : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
    },
  });

  return NextResponse.json({ user });
}
