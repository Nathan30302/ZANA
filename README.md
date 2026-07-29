# ZANA

**Style at your fingertips** — Zambia’s salon & barbershop booking marketplace.

**Mental model:** Yango for hair. Dual apps, float-based monetization, Lusaka first.

| Surface | Path | Stack |
|---|---|---|
| Customer app | `apps/customer` | Flutter |
| Provider app (ZANA Pro) | `apps/pro` | Flutter |
| Pro apply + Admin web | `apps/web` | Next.js |
| API | `apps/api` | NestJS + Prisma + PostgreSQL |
| Shared types | `packages/shared` | TypeScript |

Product blueprint: [`docs/ZANA_Product_Blueprint.pdf`](docs/ZANA_Product_Blueprint.pdf) · domain wiki: [`docs/PRODUCT.md`](docs/PRODUCT.md) · **pilot deploy:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Quick start

### Prerequisites
- Node.js 20+
- Docker Desktop (Postgres)
- Flutter 3.24+ (for mobile apps) — optional until you run apps

### 1. Database + API
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

npm install
npm run db:setup          # docker compose up + migrate + seed
npm run dev:api           # http://localhost:3000/v1/health
```

Seeded admin: `+260970000099` · OTP `123456`  
Seeded pro (Lusaka Cuts): `+260970000001` · OTP `123456`

### 2. Web (pro apply + admin)
```bash
npm run dev:web           # http://localhost:3001
```
- `/apply` — Become a Professional  
- `/admin` — approve applications  

### 3. Mobile (simulator / device)
```bash
export PATH="$HOME/development/flutter/bin:$PATH"
# Simulator (API on same machine):
cd apps/customer && flutter run
cd apps/pro && flutter run

# Physical device / internal APK — point at hosted API (see docs/DEPLOY.md):
export API_URL="https://YOUR_HOST/v1"
./scripts/build-internal.sh
```

## Pilot hosting (API + OTP + builds)

See **[`docs/DEPLOY.md`](docs/DEPLOY.md)** for:
1. Docker Compose / Fly.io API + Postgres  
2. Africa’s Talking SMS OTP (`OTP_PROVIDER=africas_talking`)  
3. Internal APK / TestFlight builds with `--dart-define=API_URL=…`  

Payments stay stubbed until you enable MoMo/Airtel intentionally.

## API surface (MVP)
| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/health` | Health |
| GET | `/v1/meta/areas` | Lusaka areas |
| POST | `/v1/auth/otp/*` | Phone OTP |
| GET | `/v1/providers` | Discover |
| POST | `/v1/bookings` | Request job |
| PATCH | `/v1/bookings/:id/status` | Accept / progress |
| POST | `/v1/bookings/:id/review` | Rate completed job |
| GET/POST | `/v1/floats/*` | Packages, MoMo/Airtel purchase, webhook confirm |
| GET | `/v1/providers?lat=&lng=` | Discover sorted by distance |
| POST | `/v1/applications` | Pro apply |
| GET/PATCH | `/v1/admin/*` | Admin queue |

## Repo
https://github.com/Nathan30302/ZANA
