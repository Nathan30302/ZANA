import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { createHash, randomInt } from "crypto";

const COOKIE = "zana_session";

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "zana-dev-secret");
}

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
};

export async function signSession(user: SessionUser) {
  return new SignJWT({
    phone: user.phone,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      phone: String(payload.phone || ""),
      name: (payload.name as string) || null,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      phone: String(payload.phone || ""),
      name: (payload.name as string) || null,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtp() {
  if (process.env.OTP_DEV_CODE) return process.env.OTP_DEV_CODE;
  return String(randomInt(100000, 999999));
}
