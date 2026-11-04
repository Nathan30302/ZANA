import { NextRequest, NextResponse } from "next/server";
import { ProStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { driveMinutes, haversineKm } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");
  const homeService = searchParams.get("homeService");
  const minRating = Number(searchParams.get("minRating") || 0);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const sort = searchParams.get("sort") || "rating";

  const pros = await prisma.professionalProfile.findMany({
    where: {
      status: ProStatus.APPROVED,
      ...(category && category !== "All" && category !== "Home Service"
        ? { category: { equals: category, mode: "insensitive" } }
        : {}),
      ...(category === "Home Service" || homeService === "1"
        ? { homeService: true }
        : {}),
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { area: { contains: q, mode: "insensitive" } },
              { services: { some: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
      ...(minRating ? { ratingAvg: { gte: minRating } } : {}),
    },
    include: {
      services: { where: { active: true }, orderBy: { priceZmw: "asc" } },
      user: { select: { phone: true, name: true, avatarUrl: true } },
    },
  });

  const origin =
    lat && lng ? { lat: Number(lat), lng: Number(lng) } : { lat: -15.4167, lng: 28.2833 };

  let rows = pros.map((p) => {
    const distanceKm =
      p.lat != null && p.lng != null
        ? haversineKm(origin, { lat: p.lat, lng: p.lng })
        : null;
    const minPrice = p.services[0]?.priceZmw ?? 0;
    const maxPrice = p.services[p.services.length - 1]?.priceZmw ?? minPrice;
    return {
      ...p,
      distanceKm,
      etaMin: distanceKm != null ? driveMinutes(distanceKm) : null,
      minPrice,
      maxPrice,
    };
  });

  if (sort === "distance") {
    rows = rows.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  } else if (sort === "price") {
    rows = rows.sort((a, b) => a.minPrice - b.minPrice);
  } else {
    rows = rows.sort((a, b) => b.ratingAvg - a.ratingAvg);
  }

  return NextResponse.json({ professionals: rows });
}
