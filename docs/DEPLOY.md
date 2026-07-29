# Deploy ZANA for a Lusaka pilot

This guide gets **API + Postgres** online, wires **Africa’s Talking SMS OTP**,
**MoMo/Airtel float payments**, **FCM push**, and builds **internal APKs / TestFlight**.

## Checklist

- [ ] Host API + Postgres (Compose or Fly)
- [ ] Set `JWT_SECRET` + `PUBLIC_BASE_URL`
- [ ] `OTP_PROVIDER=africas_talking` + AT credentials (or keep `dev` for internal QA)
- [ ] `PAYMENT_PROVIDER=mobile_money` + MoMo/Airtel keys when going live
- [ ] `FIREBASE_SERVER_KEY` + client FCM tokens for push
- [ ] Build customer + Pro APKs with `--dart-define=API_URL=…`

---

## 1. Host API + Postgres

### Option A — Docker Compose on a VPS

```bash
git clone https://github.com/Nathan30302/ZANA.git && cd ZANA

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
PAYMENT_WEBHOOK_SECRET=pick-a-webhook-secret
PORT=3000
EOF

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
curl -s https://api.yourdomain.com/v1/health
```

Put TLS in front (Caddy / Nginx / Cloudflare).

### Option B — Fly.io

```bash
fly auth login
fly apps create zana-api
fly postgres create --name zana-db --region jnb
fly postgres attach zana-db -a zana-api

fly secrets set \
  JWT_SECRET='…' \
  PUBLIC_BASE_URL='https://zana-api.fly.dev' \
  CORS_ORIGINS='*' \
  OTP_PROVIDER=africas_talking \
  AT_USERNAME='…' \
  AT_API_KEY='…' \
  AT_SENDER_ID=ZANA \
  AT_ENV=production \
  PAYMENT_PROVIDER=stub \
  PAYMENT_SIMULATE=true \
  PAYMENT_WEBHOOK_SECRET='…'

fly deploy
curl -s https://zana-api.fly.dev/v1/health
```

`fly.toml` is in the repo root (region `jnb`).

### Seed after first boot

```bash
docker compose -f docker-compose.prod.yml exec api \
  npx prisma db seed --schema=prisma/schema.prisma
```

---

## 2. Africa’s Talking SMS OTP

Local default: `OTP_PROVIDER=dev` + `OTP_DEV_CODE=123456`.

```bash
OTP_PROVIDER=africas_talking
AT_USERNAME=your_at_username
AT_API_KEY=your_at_api_key
AT_SENDER_ID=ZANA
AT_ENV=sandbox   # or production
# leave OTP_DEV_CODE unset in production
```

OTP codes live in Postgres (`OtpChallenge`, 10‑minute TTL).

---

## 3. Live MoMo / Airtel float payments

```bash
PAYMENT_PROVIDER=mobile_money
PAYMENT_SIMULATE=false
PAYMENT_WEBHOOK_SECRET=long-random-string
MOMO_SUBSCRIPTION_KEY=…
MOMO_API_USER=…
MOMO_API_KEY=…
MOMO_ENV=sandbox
AIRTEL_CLIENT_ID=…
AIRTEL_CLIENT_SECRET=…
AIRTEL_ENV=sandbox
```

Flow:
1. Pro app `POST /v1/floats/purchase` → PENDING + phone prompt
2. After approval, app polls / calls `POST /v1/floats/webhook/confirm` with `{ purchaseId }`
3. Header `x-zana-webhook-secret: $PAYMENT_WEBHOOK_SECRET` required when secret is set
4. API polls MoMo/Airtel status before crediting float

---

## 4. FCM push

Server: set `FIREBASE_SERVER_KEY` (legacy HTTP). Without it, pushes log only.

Clients register tokens after OTP login via `PATCH /v1/auth/me/fcm`.

Pilot without full Firebase config:

```bash
flutter build apk --release \
  --dart-define=API_URL=https://zana-api.fly.dev/v1 \
  --dart-define=FCM_DEMO_TOKEN=optional-test-token
```

For production, add Firebase to each Flutter app and pass the real messaging token into `registerFcmToken`.

---

## 5. Internal mobile builds

```bash
export API_URL="https://zana-api.fly.dev/v1"   # trailing /v1 required
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$HOME/development/flutter/bin"
chmod +x scripts/build-internal.sh
./scripts/build-internal.sh
```

Outputs:
- `apps/customer/build/app/outputs/flutter-apk/app-release.apk`
- `apps/pro/build/app/outputs/flutter-apk/app-release.apk`

### iOS / TestFlight

```bash
export API_URL="https://zana-api.fly.dev/v1"
cd apps/customer && flutter build ipa --release --dart-define="API_URL=$API_URL"
cd ../pro && flutter build ipa --release --dart-define="API_URL=$API_URL"
```

---

## 6. Web (apply + admin)

Point Next at the hosted API:

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=https://zana-api.fly.dev/v1
npm run build -w apps/web && npm run start -w apps/web
```

Seed admin: `+260970000099` · OTP `123456` (dev OTP only).
