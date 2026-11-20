import { NextResponse } from "next/server";
import { zambiaMapInfo } from "@/lib/zambia-file";

export const dynamic = "force-dynamic";

export async function GET() {
  const stat = zambiaMapInfo(true);
  return NextResponse.json({
    ready: stat.ready,
    bytes: stat.bytes,
    download: stat.download,
    name: "Zambia",
  });
}
