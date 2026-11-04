#!/usr/bin/env bash
# Download Zambia once (OpenStreetMap) and build the street + building map Zana uses.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/data"
mkdir -p "$DATA" /tmp/tilemaker-store
PBF="$DATA/zambia.osm.pbf"
OUT="$DATA/zambia.mbtiles"
# The .mbtiles suffix makes tilemaker write one file. Any other suffix becomes a folder of tiles.
TMP="$DATA/zambia.build.mbtiles"

if [[ ! -s "$PBF" ]]; then
  echo "Downloading Zambia from Geofabrik…"
  curl -fL --retry 4 --retry-delay 2 \
    -A "ZanaBeauty/1.0 (https://github.com/Nathan30302/ZANA; Zambia map)" \
    -o "$PBF" \
    "https://download.geofabrik.de/africa/zambia-latest.osm.pbf"
fi

echo "Building streets and buildings…"
rm -rf /tmp/tilemaker-store
mkdir -p /tmp/tilemaker-store
tilemaker \
  --input "$PBF" \
  --output "$TMP" \
  --config "$ROOT/scripts/zambia-map/config.json" \
  --process "$ROOT/scripts/zambia-map/process.lua" \
  --store /tmp/tilemaker-store \
  --threads 2
mv "$TMP" "$OUT"
echo "Zambia map ready: $OUT"
