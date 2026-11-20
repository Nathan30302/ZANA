import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  if (!lat || !lng) return NextResponse.json({ error: "lat and lng required" }, { status: 400 });

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ZanaBeauty/1.0 (booking map; lusaka)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return NextResponse.json({ label: `${lat}, ${lng}` });
  const data = await res.json();
  const a = data.address || {};
  const label =
    data.name ||
    [a.building, a.road, a.suburb || a.neighbourhood, a.city || "Lusaka"]
      .filter(Boolean)
      .join(", ") ||
    data.display_name;

  return NextResponse.json({
    label,
    displayName: data.display_name,
    lat: Number(lat),
    lng: Number(lng),
  });
}
