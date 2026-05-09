# ZANA Platform - Complete Startup Guide

This document provides step-by-step instructions to launch the entire ZANA ecosystem locally.

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

## Architecture Overview

**Single Backend API (localhost:3000)**
- Node.js/Express with Prisma ORM
- Handles auth, venues, mobile providers, bookings, reviews, payments
- Supports role-based access control (CUSTOMER, PROVIDER_MOBILE, PROVIDER_VENUE, ADMIN)

**Three Expo Apps (separate ports)**
- **Customer App** (localhost:3001) - Browse and book services
- **Provider App** (localhost:3002) - Manage business and accept bookings
- **Admin App** (localhost:3003) - Approve pending providers and venues

## Setup Steps

### 1. Clone and Install Dependencies

```bash
cd ZANA
npm install  # Installs all workspace packages
```

This automatically installs:
- `designer/backend` dependencies
- `designer/apps/customer` dependencies
- `designer/apps/provider` dependencies
- `designer/apps/admin` dependencies

### 2. Configure Backend Environment

```bash
cd designer/backend

# Copy example env file
cp .env.example .env

# Edit .env with your values:
#   DATABASE_URL (PostgreSQL connection)
#   JWT_SECRET (random string)
#   CLOUDINARY_* (image upload service)
#   SMTP_* (email service, optional)
#   STRIPE_* (payments, optional)
```

### 3. Initialize Database

```bash
cd designer/backend

# Generate Prisma client
npx prisma generate

# Create/migrate database
npx prisma db push

# (Optional) Seed default data
npx prisma db seed
```

### 4. Start Backend Server

```bash
cd designer/backend
npm start

# Server runs on http://localhost:3000
# Health check: http://localhost:3000/health
```

### 5. Start Apps (in separate terminals)

**Customer App:**
```bash
cd designer/apps/customer
npm start

# Opens Expo Dev Tools. Press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web (http://localhost:3001)
```

**Provider App:**
```bash
cd designer/apps/provider
npm start

# Opens Expo Dev Tools
# Access via web at http://localhost:3002
```

**Admin App:**
```bash
cd designer/apps/admin
npm start

# Opens Expo Dev Tools
# Access via web at http://localhost:3003
```

## Quick Test Workflow

### 1. Create Admin Account (via backend seed or direct DB)

```bash
# Admin user for approval queue (created via Prisma seed)
Email: admin@zana.zm
Password: admin123
Role: ADMIN
```

### 2. Register Provider

**In Provider App:**
1. Open http://localhost:3002
2. Tap "Don't have an account? Register"
3. Fill in details, select provider type (Salon or Mobile)
4. Create first service
5. Tap "Finish onboarding"
6. See "Await Approval" screen

### 3. Review & Approve in Admin

**In Admin App:**
1. Open http://localhost:3003
2. Login with admin credentials
3. See pending provider/venue in queue
4. Tap Approve or Reject
5. Provider is now discoverable in customer app

### 4. Book as Customer

**In Customer App:**
1. Open http://localhost:3001
2. Sign up as customer
3. Browse "Featured" or search venues
4. Select provider → service → time
5. Complete booking

## API Endpoints (Quick Reference)

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Provider Discovery
- `GET /api/v1/venues` - List approved venues (with location filter)
- `GET /api/v1/mobile-providers` - List approved mobile professionals
- `GET /api/v1/venues/:id` - Get venue detail
- `GET /api/v1/mobile-providers/:id` - Get provider detail

### Provider Management
- `POST /api/v1/venues` - Create venue (PROVIDER_VENUE role)
- `POST /api/v1/mobile-providers` - Create mobile profile (PROVIDER_MOBILE role)
- `GET /api/v1/venue/profile` - Get current provider's venue
- `GET /api/v1/mobile-providers/profile` - Get current mobile provider

### Bookings
- `GET /api/v1/bookings` - List user bookings
- `POST /api/v1/bookings` - Create booking
- `PATCH /api/v1/bookings/:id/confirm` - Accept booking
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/v1/admin/queue` - Get pending approvals (ADMIN only)
- `PATCH /api/v1/venues/:id/status` - Approve/reject venue
- `PATCH /api/v1/mobile-providers/:id/status` - Approve/reject provider

## Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env is correct
# Check JWT_SECRET is set
npm start --verbose
```

### Apps can't connect to backend
```bash
# Verify backend is running: curl http://localhost:3000/health
# Check app API endpoint (should be http://localhost:3000/api/v1)
# Ensure CORS origin matches your dev port
```

### Database errors
```bash
# Recreate schema
npx prisma migrate reset

# Check connection
psql $DATABASE_URL
```

## Project Structure

```
designer/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── server.js          # Entry point
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, validation
│   │   ├── services/          # Business logic
│   │   └── controllers/       # Route handlers
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
└── apps/
    ├── customer/              # Expo React Native customer app
    │   ├── app/               # Expo Router pages
    │   ├── services/          # API client
    │   ├── stores/            # Zustand state
    │   └── package.json
    ├── provider/              # Expo React Native provider portal
    │   ├── app/               # Expo Router pages
    │   ├── services/          # API client
    │   ├── stores/            # Zustand state
    │   └── package.json
    └── admin/                 # Expo React Native admin dashboard
        ├── app/               # Expo Router pages
        ├── services/          # API client
        ├── stores/            # Zustand state
        └── package.json
```

## Development Tips

- **Hot reload:** Both Expo and Node.js watch for changes; refresh browser/app to see updates
- **Database debugging:** Use `npx prisma studio` to view/edit data
- **API testing:** Use Postman or curl to test backend endpoints
- **Mobile testing:** Use Expo Go app on real phone for (better experience than simulators

## Deployment

For production deployment, refer to the main README.md or DEPLOYMENT.md guide.

---

For questions or issues, check the project documentation or raise an issue on GitHub.
