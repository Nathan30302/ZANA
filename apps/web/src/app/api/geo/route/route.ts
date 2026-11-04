import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fromLat = Number(req.nextUrl.searchParams.get("fromLat"));
  const fromLng = Number(req.nextUrl.searchParams.get("fromLng"));
  const toLat = Number(req.nextUrl.searchParams.get("toLat"));
  const toLng = Number(req.nextUrl.searchParams.get("toLng"));
  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "coordinates required" }, { status: 400 });
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ coordinates: [], distanceKm: null, durationMin: null });
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return NextResponse.json({ coordinates: [], distanceKm: null, durationMin: null });

  const coordinates = (route.geometry?.coordinates || []).map(([lng, lat]: [number, number]) => [lat, lng]);
  return NextResponse.json({
    coordinates,
    distanceKm: route.distance / 1000,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
  });
}
