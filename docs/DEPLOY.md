# Deploy ZANA for a Lusaka pilot

Payments stay stubbed. This guide gets **API + Postgres** online, optionally wires **Africa’s Talking SMS OTP**, and builds **internal APKs / TestFlight**.

## 1. Host API + Postgres

### Option A — Docker Compose on a VPS

```bash
# On the server
git clone https://github.com/Nathan30302/ZANA.git && cd ZANA

# Create env (never commit secrets)
cat > .env.prod <<'EOF'
POSTGRES_USER=zana
POSTGRES_PASSWORD=pick-a-strong-password
POSTGRES_DB=zana
JWT_SECRET=pick-a-long-random-secret
PUBLIC_BASE_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com,*
OTP_PROVIDER=dev
OTP_DEV_CODE=123456
PAYMENT_PROVIDER=stub
PAYMENT_SIMULATE=true
PORT=3000
EOF

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
curl -s https://api.yourdomain.com/v1/health
```

Put TLS in front (Caddy / Nginx / Cloudflare). Point `PUBLIC_BASE_URL` at the public HTTPS origin so upload URLs work on phones.

### Option B — Fly.io

```bash
# once
fly auth login
fly apps create zana-api
fly postgres create --name zana-db --region jnb
fly postgres attach zana-db -a zana-api

fly secrets set \
  JWT_SECRET='…' \
  PUBLIC_BASE_URL='https://zana-api.fly.dev' \
  CORS_ORIGINS='*' \
  OTP_PROVIDER=dev \
  OTP_DEV_CODE=123456 \
  PAYMENT_PROVIDER=stub \
  PAYMENT_SIMULATE=true

fly deploy
curl -s https://zana-api.fly.dev/v1/health
```

`fly.toml` is in the repo root. Region `jnb` is Johannesburg (closest common Fly region to Zambia).

### Seed after first boot (optional)

```bash
# Compose
docker compose -f docker-compose.prod.yml exec api \
  npx prisma db seed --schema=prisma/schema.prisma

# Or connect DATABASE_URL locally and: npm run prisma:seed -w apps/api
```

---

## 2. Africa’s Talking SMS OTP (env-gated)

Local default remains `OTP_PROVIDER=dev` + `OTP_DEV_CODE=123456`.

For real phones:

```bash
OTP_PROVIDER=africas_talking
AT_USERNAME=your_at_username
AT_API_KEY=your_at_api_key
AT_SENDER_ID=ZANA
AT_ENV=sandbox          # or production
# leave OTP_DEV_CODE unset in production
```

OTP codes are stored in Postgres (`OtpChallenge`, 10‑minute TTL) so multiple API instances share the same challenge.

Sandbox tip: Africa’s Talking sandbox only delivers to numbers you whitelist in their console.

---

## 3. Internal mobile builds

Point apps at the **hosted** API (phones cannot use `localhost`):

```bash
export API_URL="https://zana-api.fly.dev/v1"   # trailing /v1 required
chmod +x scripts/build-internal.sh
./scripts/build-internal.sh
```

Outputs:
- `apps/customer/build/app/outputs/flutter-apk/app-release.apk`
- `apps/pro/build/app/outputs/flutter-apk/app-release.apk`

Sideload APKs for Android pilot testers.

### iOS / TestFlight

```bash
export API_URL="https://zana-api.fly.dev/v1"
cd apps/customer && flutter build ipa --release --dart-define="API_URL=$API_URL"
# open Xcode → Product → Archive → Distribute → TestFlight
cd ../pro && flutter build ipa --release --dart-define="API_URL=$API_URL"
```

You need an Apple Developer account and signing identities for each app.

### Same Wi‑Fi LAN smoke (no cloud)

```bash
# Mac LAN IP, API running on :3000
export API_URL="http://192.168.1.20:3000/v1"
./scripts/build-internal.sh
```

Android cleartext HTTP is enabled for pilot; prefer HTTPS in production.

---

## Checklist before inviting testers

- [ ] `GET /v1/health` OK on public URL  
- [ ] Strong `JWT_SECRET` set  
- [ ] `PUBLIC_BASE_URL` is HTTPS and matches the phone-facing host  
- [ ] OTP: either keep `dev` for closed demo, or AT sandbox with whitelisted numbers  
- [ ] Customer + Pro APKs/IPAs built with the same `API_URL`  
- [ ] Payments still stub (`PAYMENT_PROVIDER=stub`) until you choose to go live  

Web apply/admin: set `NEXT_PUBLIC_API_URL` to the same `/v1` base when you deploy `apps/web`.
