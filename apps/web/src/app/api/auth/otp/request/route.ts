import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";

const bodySchema = z.object({
  phone: z.string().min(9),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  const phone = normalizePhone(parsed.data.phone);
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpChallenge.create({
    data: { phone, codeHash: hashOtp(code), expiresAt },
  });

  // Zambia: wire Africa's Talking / SMS provider in production.
  return NextResponse.json({
    ok: true,
    phone,
    // Dev convenience — always returned when OTP_DEV_CODE is set
    devCode: process.env.OTP_DEV_CODE || undefined,
    message: "OTP sent",
  });
}
