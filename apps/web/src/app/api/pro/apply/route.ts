import { NextResponse } from "next/server";
import { ProStatus, ProType, Role } from "@prisma/client";
import { z } from "zod";
import { getSession, setSessionCookie, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  displayName: z.string().min(2),
  fullName: z.string().min(2),
  type: z.enum(["INDEPENDENT", "SHOP"]),
  category: z.string().min(2),
  bio: z.string().optional(),
  area: z.string().min(2),
  address: z.string().optional(),
  homeService: z.boolean().default(true),
  travelFeeZmw: z.number().int().min(0).default(50),
  lat: z.number().optional(),
  lng: z.number().optional(),
  coverUrl: z.string().url().optional(),
  idDocumentUrl: z.string().min(1),
  portfolioUrls: z.array(z.string()).default([]),
  services: z
    .array(
      z.object({
        name: z.string(),
        category: z.string(),
        durationMin: z.number().int().positive(),
        priceZmw: z.number().int().positive(),
        homeEligible: z.boolean().default(true),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.professionalProfile.findUnique({ where: { userId: session.id } });
  if (existing && existing.status !== ProStatus.REJECTED) {
    return NextResponse.json({ error: "Application already exists", professional: existing }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name: parsed.data.fullName,
      role: Role.PROFESSIONAL,
    },
  });

  const data = {
    displayName: parsed.data.displayName,
    type: parsed.data.type === "SHOP" ? ProType.SHOP : ProType.INDEPENDENT,
    status: ProStatus.PENDING,
    verified: false,
    bio: parsed.data.bio || null,
    category: parsed.data.category,
    area: parsed.data.area,
    address: parsed.data.address || `${parsed.data.area}, Lusaka`,
    homeService: parsed.data.homeService,
    travelFeeZmw: parsed.data.travelFeeZmw,
    lat: parsed.data.lat ?? -15.4167,
    lng: parsed.data.lng ?? 28.2833,
    coverUrl: parsed.data.coverUrl || parsed.data.portfolioUrls[0] || null,
    services: { create: parsed.data.services },
    documents: {
      create: [
        { kind: "ID", url: parsed.data.idDocumentUrl },
        ...parsed.data.portfolioUrls.map((url) => ({ kind: "PORTFOLIO", url })),
      ],
    },
    portfolio: {
      create: parsed.data.portfolioUrls.slice(0, 6).map((url) => ({ url })),
    },
    hours: {
      create: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        startMin: 9 * 60,
        endMin: 18 * 60,
        enabled: true,
      })),
    },
  };

  const professional = existing
    ? await prisma.professionalProfile.update({
        where: { id: existing.id },
        data: {
          ...data,
          services: undefined,
          documents: undefined,
          portfolio: undefined,
          hours: undefined,
          rejectionReason: null,
        },
      })
    : await prisma.professionalProfile.create({
        data: { userId: session.id, ...data },
        include: { services: true, documents: true },
      });

  if (existing) {
    await prisma.service.deleteMany({ where: { professionalId: existing.id } });
    await prisma.service.createMany({
      data: parsed.data.services.map((s) => ({ ...s, professionalId: existing.id })),
    });
  }

  const token = await signSession({
    id: session.id,
    phone: session.phone,
    name: parsed.data.fullName,
    role: Role.PROFESSIONAL,
  });
  await setSessionCookie(token);

  return NextResponse.json({ professional }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const professional = await prisma.professionalProfile.findUnique({
    where: { userId: session.id },
    include: {
      services: true,
      hours: true,
      documents: true,
      portfolio: true,
    },
  });
  return NextResponse.json({ professional });
}
