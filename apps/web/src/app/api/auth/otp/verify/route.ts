import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashOtp, setSessionCookie, signSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";

const bodySchema = z.object({
  phone: z.string().min(9),
  code: z.string().min(4),
  name: z.string().optional(),
  role: z.enum(["CUSTOMER", "PROFESSIONAL", "ADMIN"]).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge || challenge.codeHash !== hashOtp(parsed.data.code)) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumed: true },
  });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const role =
      parsed.data.role === "PROFESSIONAL"
        ? Role.PROFESSIONAL
        : parsed.data.role === "ADMIN"
          ? Role.ADMIN
          : Role.CUSTOMER;
    user = await prisma.user.create({
      data: {
        phone,
        name: parsed.data.name || null,
        role,
      },
    });
  } else if (parsed.data.name && !user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    });
  }

  const token = await signSession({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  const professional = await prisma.professionalProfile.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      email: user.email,
    },
    professional,
  });
}
