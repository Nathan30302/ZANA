import { createReadStream } from "fs";
import { Readable } from "stream";
import { zambiaMapInfo } from "@/lib/zambia-file";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const stat = zambiaMapInfo();
  if (!stat.download) {
    return Response.json({ error: "Zambia map is still downloading" }, { status: 404 });
  }
  const stream = createReadStream(stat.file);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(stat.bytes),
      "Content-Disposition": 'attachment; filename="Zambia.mbtiles"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
