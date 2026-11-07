# Zana

**Beauty on your fingertips** — Zambia’s beauty services marketplace for salons, barbershops, and independent professionals, with first-class **home service** booking.

Built as a production-structured Next.js app (customer + professional + admin) on Nest-style API routes, Prisma, and PostgreSQL. Mobile-first UI ready for Expo/React Native wrappers later.

## Surfaces

| Surface | Path | Who |
|---|---|---|
| Customer app | `/` → `/home` | Discover & book |
| Professional app | `/pro` | Apply, calendar, earnings, float |
| Admin panel | `/admin` | Approvals, analytics, commission |

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind + TypeScript  
- **Backend:** Next.js Route Handlers  
- **DB:** PostgreSQL + Prisma  
- **Auth:** Phone + OTP (demo code `123456`)  
- **Payments:** Float wallet with MTN/Airtel/Card top-up stubs (Flutterwave-ready)  
- **Currency:** Zambian Kwacha (K / ZMW)

## Quick start

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (local or Docker)

### 1. Database
```bash
# Option A — Docker
docker compose up -d

# Option B — local Postgres user/db already created:
# createuser zana with password 'zana' superuser;
# create database zana owner zana;
```

### 2. App
```bash
cd apps/web
cp .env.example .env   # defaults point at postgresql://zana:zana@localhost:5432/zana
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

From repo root you can also run `npm run dev` (workspace).

### 3. Zambia map

The map is one download of Zambia (streets and building shapes), not a live world-tile feed. Build it once:

```bash
bash scripts/download-zambia-map.sh
```

That writes `data/zambia.mbtiles` (outside the Next.js app so the build does not try to bundle it). In the app, a place shows where it is. **Open map** fills the screen with your arrow. Choose **I'm going there** or **They're coming to me**, then tap **Route me** for car or walk. The map on screen is that Zambia download.

## Demo accounts (OTP always `123456`)

| Role | Phone |
|---|---|
| Customer | `+260970000010` |
| Professional (approved) | `+260970000001` |
| Professional (pending app) | `+260970000020` |
| Admin | `+260970000099` |

## Core flows that work

1. **Customer:** browse → open pro (map shows where the place is) → Open map for the full screen and your arrow → Book Now → choose **I'm going there** or **They're coming to me** → **Route me** for car or walk → confirm  
2. **Professional:** login → dashboard accept/start/complete → calendar → float top-up → manage services  
3. **Admin:** review applications → approve/reject → adjust commission %  

Commission is deducted from the pro **float** when a booking is marked **COMPLETED**.

## Brand

Logo files live in [`brand/`](brand/) and are copied to `apps/web/public/brand/`.

Slogan: **Beauty on your fingertips**

## Product reference

Business plan PDF provided by the founder (Nov 2026) is the source of truth for roles, float model, and roadmap.
