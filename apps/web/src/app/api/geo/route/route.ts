import { NextRequest, NextResponse } from "next/server";
import { fetchDrivingRoute } from "@/lib/directions";

export async function GET(req: NextRequest) {
  const fromLat = Number(req.nextUrl.searchParams.get("fromLat"));
  const fromLng = Number(req.nextUrl.searchParams.get("fromLng"));
  const toLat = Number(req.nextUrl.searchParams.get("toLat"));
  const toLng = Number(req.nextUrl.searchParams.get("toLng"));
  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "coordinates required" }, { status: 400 });
  }

  const route = await fetchDrivingRoute(
    { lat: fromLat, lng: fromLng },
    { lat: toLat, lng: toLng },
  );
  return NextResponse.json(route);
}
