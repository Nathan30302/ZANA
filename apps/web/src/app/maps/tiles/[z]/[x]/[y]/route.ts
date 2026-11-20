import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { gunzipSync } from "zlib";
import { zambiaMapInfo } from "@/lib/zambia-file";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let database: DatabaseSync | null = null;
let openedFile = "";
let query: ReturnType<DatabaseSync["prepare"]> | null = null;

function sqliteTile(file: string, zoom: number, column: number, row: number) {
  if (!database || openedFile !== file) {
    database?.close();
    database = new DatabaseSync(file, { readOnly: true });
    query = database.prepare(
      "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?",
    );
    openedFile = file;
  }
  const tmsY = (1 << zoom) - 1 - row;
  const found = query!.get(zoom, column, tmsY) as { tile_data?: Uint8Array } | undefined;
  return found?.tile_data ? Buffer.from(found.tile_data) : null;
}

function decode(raw: Buffer) {
  return raw.length > 2 && raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw;
}

export async function GET(
  _: Request,
  ctx: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await ctx.params;
  const zoom = Number(z);
  const column = Number(x);
  const row = Number(y);
  if (![zoom, column, row].every((n) => Number.isInteger(n) && n >= 0) || zoom > 15) {
    return new Response(null, { status: 204 });
  }

  const info = zambiaMapInfo();
  if (!info.ready) return new Response(null, { status: 404 });

  let raw: Buffer | null = null;
  if (info.kind === "dir") {
    const root = path.resolve(info.file);
    const target = path.resolve(root, String(zoom), String(column), `${row}.pbf`);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
      return new Response(null, { status: 204 });
    }
    raw = fs.readFileSync(target);
  } else {
    raw = sqliteTile(info.file, zoom, column, row);
    if (!raw) return new Response(null, { status: 204 });
  }

  const body = decode(raw);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.mapbox-vector-tile",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
