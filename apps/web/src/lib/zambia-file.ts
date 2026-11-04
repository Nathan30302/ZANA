import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

export type ZambiaMapInfo = {
  ready: boolean;
  bytes: number;
  file: string;
  kind: "missing" | "dir" | "mbtiles";
  download: boolean;
};

const candidates = () =>
  [
    process.env.ZAMBIA_MAP_PATH,
    path.resolve(process.cwd(), "data/zambia"),
    path.resolve(process.cwd(), "data/zambia.mbtiles"),
    path.resolve(process.cwd(), "../../data/zambia"),
    path.resolve(process.cwd(), "../../data/zambia.mbtiles"),
    path.resolve(process.cwd(), "apps/web/data/zambia.mbtiles"),
  ].filter((item): item is string => Boolean(item));

let byteCache: { file: string; bytes: number } | null = null;

function directoryBytes(file: string) {
  if (byteCache?.file === file) return byteCache.bytes;
  try {
    const out = execFileSync("du", ["-sb", file], { encoding: "utf8" });
    const bytes = Number(out.split(/\s/)[0]) || 0;
    byteCache = { file, bytes };
    return bytes;
  } catch {
    return 0;
  }
}

export function zambiaMapInfo(withSize = false): ZambiaMapInfo {
  const file = candidates().find((item) => fs.existsSync(item)) || candidates()[0];
  if (!fs.existsSync(file)) {
    return { ready: false, bytes: 0, file, kind: "missing", download: false };
  }
  const stat = fs.statSync(file);
  if (stat.isDirectory()) {
    const ready = fs.existsSync(path.join(file, "15"));
    return {
      ready,
      bytes: withSize && ready ? directoryBytes(file) : byteCache?.file === file ? byteCache.bytes : 0,
      file,
      kind: "dir",
      download: false,
    };
  }
  const ready = stat.size > 1024 * 1024;
  return { ready, bytes: stat.size, file, kind: "mbtiles", download: ready };
}
