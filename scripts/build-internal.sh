#!/usr/bin/env bash
# Build release APKs for internal pilot distribution.
# Usage:
#   export API_URL="https://your-api.example.com/v1"
#   ./scripts/build-internal.sh
# Optional:
#   APP=customer|pro|both (default both)
#   BUILD=apk|appbundle (default apk)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-}"
APP="${APP:-both}"
BUILD="${BUILD:-apk}"
FLUTTER_BIN="${FLUTTER_BIN:-$HOME/development/flutter/bin/flutter}"

if [[ -z "$API_URL" ]]; then
  echo "Set API_URL to your hosted API, e.g.:"
  echo '  export API_URL="https://zana-api.fly.dev/v1"'
  exit 1
fi

if [[ ! -x "$FLUTTER_BIN" ]]; then
  if command -v flutter >/dev/null 2>&1; then
    FLUTTER_BIN="$(command -v flutter)"
  else
    echo "Flutter not found. Set FLUTTER_BIN or install Flutter."
    exit 1
  fi
fi

echo "API_URL=$API_URL"
echo "BUILD=$BUILD APP=$APP"

build_one() {
  local dir="$1"
  local name="$2"
  echo "==== Building $name ===="
  cd "$ROOT/$dir"
  "$FLUTTER_BIN" pub get
  if [[ "$BUILD" == "appbundle" ]]; then
    "$FLUTTER_BIN" build appbundle --release --dart-define="API_URL=$API_URL"
    echo "→ $dir/build/app/outputs/bundle/release/app-release.aab"
  else
    "$FLUTTER_BIN" build apk --release --dart-define="API_URL=$API_URL"
    echo "→ $dir/build/app/outputs/flutter-apk/app-release.apk"
  fi
}

case "$APP" in
  customer) build_one apps/customer zana_customer ;;
  pro) build_one apps/pro zana_pro ;;
  both)
    build_one apps/customer zana_customer
    build_one apps/pro zana_pro
    ;;
  *)
    echo "APP must be customer|pro|both"
    exit 1
    ;;
esac

echo "Done. Sideload APKs or upload AABs for Play internal testing."
echo "iOS: open apps/*/ios in Xcode, set signing, Archive → TestFlight."
echo "  flutter build ipa --release --dart-define=API_URL=$API_URL"
