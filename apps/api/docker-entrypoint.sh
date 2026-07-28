#!/sh
set -eu
cd /app/apps/api
echo "[zana-api] Running migrations…"
npx prisma migrate deploy --schema=prisma/schema.prisma
echo "[zana-api] Starting Nest…"
exec node dist/main.js
