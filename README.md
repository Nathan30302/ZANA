# ZANA

Zambia’s beauty booking marketplace — salons, barbershops, and mobile stylists.

**Mental model:** Yango for hair. Dual apps, float-based monetization, Lusaka first.

| Surface | Path | Stack |
|---|---|---|
| Customer app | `apps/customer` | Flutter |
| Provider app (ZANA Pro) | `apps/pro` | Flutter |
| Pro apply + Admin web | `apps/web` | Next.js |
| API | `apps/api` | NestJS + Prisma + PostgreSQL |
| Shared types | `packages/shared` | TypeScript |

Product blueprint: [`docs/ZANA_Product_Blueprint.pdf`](docs/ZANA_Product_Blueprint.pdf) · domain wiki: [`docs/PRODUCT.md`](docs/PRODUCT.md)

## Quick start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Flutter 3.24+ (for mobile apps)

### 1. API
```bash
cp apps/api/.env.example apps/api/.env
# set DATABASE_URL

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:api
```
API: `http://localhost:3000/v1/health`

### 2. Web (pro apply + admin)
```bash
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```
Web: `http://localhost:3001`

### 3. Mobile
```bash
cd apps/customer && flutter pub get && flutter run
cd apps/pro && flutter pub get && flutter run
```

## Repo
https://github.com/Nathan30302/ZANA
