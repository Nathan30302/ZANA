# ZANA Ecosystem - Validation & Testing Guide

## System Overview

The ZANA platform is now a **fully connected ecosystem** with three integrated apps and a unified backend:

- **Backend API**: Express + Prisma + PostgreSQL (localhost:3000)
- **Customer App**: Browse & book services (Expo web at 3001)
- **Provider App**: Manage venues/mobile profiles, accept bookings (Expo web at 3002)
- **Admin App**: Approve provider applications (Expo web at 3003)

---

## Architecture Verification Checklist

### Backend (`designer/backend/`)

- ✅ Main server: `src/server.js` - All routes registered
  - `/api/v1/auth` - User registration/login/refresh
  - `/api/v1/venues` - Venue management
  - `/api/v1/mobile-providers` - Mobile provider management  
  - `/api/v1/services` - Service CRUD
  - `/api/v1/admin` - Approval queue + status updates
  - `/api/v1/bookings`, `/api/v1/reviews`, `/api/v1/payments` - Additional features

- ✅ Auth middleware: `src/middleware/auth.js`
  - `verifyToken()` - JWT validation + user lookup
  - `requireRole(roles)` - Role-based access control
  - `optionalAuth()` - For public endpoints

- ✅ Admin routes: `src/routes/admin.js`
  - `GET /admin/queue` - Paginated pending approvals with services
  - `PATCH /admin/venues/:id/status` - Venue approval/rejection
  - `PATCH /admin/mobile-providers/:id/status` - Mobile provider approval/rejection

- ✅ Service routes: `src/routes/services.js`
  - `POST /venues/:id/services` - Create service for venue
  - `POST /mobile-providers/:id/services` - Create service for mobile provider

- ✅ Venue profile: `src/routes/venue.js`
  - `GET /venue/profile` - Get authenticated provider's venue

- ✅ Mobile provider profile: `src/routes/mobileProviders.js`
  - `GET /mobile-providers/profile` - Get authenticated provider's mobile profile

- ✅ Prisma schema: `prisma/schema.prisma`
  - User model with Role enum (CUSTOMER, PROVIDER_MOBILE, PROVIDER_VENUE, ADMIN)
  - Venue model with VenueStatus (PENDING, APPROVED, SUSPENDED, REJECTED)
  - MobileProvider model with same status enum
  - Service model linked to both Venue and MobileProvider
  - Booking, Review, Staff, Availability, OpeningHours models

---

### Provider App (`designer/apps/provider/`)

- ✅ Auth Store: `stores/authStore.ts`
  - Zustand store with Venue and MobileProvider support
  - `setAuth()` - Persist auth + profile
  - `restoreAuth()` - Restore from AsyncStorage on app launch
  - `setMobileProvider()` - Store mobile provider profile
  - Auto-logout clears all storage keys

- ✅ API Client: `services/api.ts`
  - `register()` - Creates user + fetches correct profile (venue or mobile)
  - `login()` - Authenticates + retrieves profile
  - `createVenue()` - Creates venue for PROVIDER_VENUE flow
  - `createMobileProvider()` - Creates mobile profile for PROVIDER_MOBILE flow
  - `createService()` - Routes to correct endpoint based on providerType
  - `getVenueProfile()` / `getMobileProviderProfile()` - Profile retrieval

- ✅ Root Layout: `app/_layout.tsx`
  - Calls `restoreAuth()` on app startup
  - Auto-redirects authenticated providers to dashboard
  - Waits for `isLoading` to complete before routing

- ✅ Auth Flow (`app/(auth)/`)
  - `login.tsx` - Email/password login
  - `register.tsx` - Registration with provider type selection (PROVIDER_VENUE or PROVIDER_MOBILE)

- ✅ Onboarding Flow (`app/onboarding/`)
  - `business.tsx` - Collects business info, creates Venue or MobileProvider, passes profileId to next screen
  - `services.tsx` - Creates first service using profileId + providerType, routes to correct endpoint
  - `complete.tsx` - Shows "Approval Pending" message

---

### Admin App (`designer/apps/admin/`)

- ✅ Auth Store: `stores/authStore.ts`
  - Zustand store with persistent storage
  - `setAuth()` - Persist admin credentials
  - `restoreAuth()` - Restore from AsyncStorage on app launch
  - `setLoading()` - Track app startup state

- ✅ API Client: `services/api.ts`
  - `login()` - Admin authentication
  - `getQueue()` - Fetch pending venues + mobile providers with pagination
  - `updateVenueStatus()` - PATCH call to approve/reject venue
  - `updateMobileProviderStatus()` - PATCH call to approve/reject mobile provider

- ✅ Root Layout: `app/_layout.tsx`
  - Calls `restoreAuth()` on app startup
  - Auto-redirects authenticated admins to approval queue
  - Waits for `isLoading` to complete

- ✅ Auth Screen: `app/(auth)/login.tsx`
  - Email/password login form
  - Calls `adminApi.login()` and stores auth via Zustand

- ✅ Approval Queue: `app/(tabs)/queue.tsx`
  - Displays pending venues in scrollable cards
  - Shows owner details and services count
  - Displays pending mobile providers with user info
  - Approve/Reject buttons trigger status updates
  - Loading states during submission
  - Refreshes queue after successful action

---

### Customer App (`designer/apps/customer/`)

- ✅ Professional Sign-in Entry: `app/(tabs)/account.tsx`
  - "Join as a Professional" menu item at top
  - Links to `https://zana.zm/provider` (opens in browser or shows alert)
  - Customers can navigate to provider portal

---

## End-to-End Test Workflow

### Phase 1: Setup & Initialization

1. **Start Backend**
   ```bash
   cd ZANA/designer/backend
   npm install
   cp .env.example .env
   # Configure DATABASE_URL, JWT_SECRET, etc.
   npx prisma migrate deploy
   npm start
   # Expected: Server running on localhost:3000
   ```

2. **Seed Admin Account** (via Prisma seed or direct DB)
   ```sql
   INSERT INTO "User" (id, email, phone, password, "firstName", "lastName", role, "isVerified", "isActive")
   VALUES ('admin-id-123', 'admin@zana.zm', '260123456789', '$2a$12$...', 'Admin', 'User', 'ADMIN', true, true);
   ```

3. **Start All Apps**
   - Provider App: `cd designer/apps/provider && npm start` → http://localhost:3002
   - Admin App: `cd designer/apps/admin && npm start` → http://localhost:3003
   - Customer App: `cd designer/apps/customer && npm start` → http://localhost:3001

### Phase 2: Provider Registration Flow

1. **Open Provider App** (http://localhost:3002)
   - Tap "Don't have an account? Register"
   - Fill in: First name, Last name, Email/Phone, Password
   - **Select provider type:** "Salon Owner" (PROVIDER_VENUE) or "Independent Professional" (PROVIDER_MOBILE)
   - Tap "Register"
   
2. **Expected Outcomes:**
   - User account created in DB with selected role
   - If PROVIDER_VENUE: Redirects to business info screen
   - If PROVIDER_MOBILE: Redirects to business info screen (collects different fields)
   - Auth tokens stored in AsyncStorage
   
3. **Fill Business Details** (`onboarding/business.tsx`)
   - Business name
   - Description
   - Phone, Email, Address
   - Tap "Next"
   
4. **Expected Outcomes:**
   - Creates Venue (if PROVIDER_VENUE) or MobileProvider (if PROVIDER_MOBILE)
   - Receives profileId from backend
   - Passes profileId to services screen
   - Status set to PENDING in database

5. **Add First Service** (`onboarding/services.tsx`)
   - Service name, description, price (ZMW), duration (minutes)
   - Tap "Finish onboarding"
   
6. **Expected Outcomes:**
   - Service created and linked to venue/mobileProvider via profileId
   - Redirects to approval pending screen
   - Shows message: "Your profile is awaiting admin approval"

### Phase 3: Admin Approval Flow

1. **Open Admin App** (http://localhost:3003)
   - Tap "Logout" if cached login exists
   - Enter: admin@zana.zm / admin123
   - Tap "Login"

2. **Expected Outcomes:**
   - Admin authenticated
   - Redirected to approval queue
   - Tokens stored in AsyncStorage

3. **Review Approval Queue** (`app/(tabs)/queue.tsx`)
   - See section: "Venues awaiting approval" or "Mobile providers awaiting approval"
   - Each card shows:
     - Business/Provider name
     - Description
     - Owner/User email and phone
     - Number of services added
     - Approve & Reject buttons

4. **Approve Provider**
   - Tap "Approve" on any pending venue/provider
   - Loading indicator shows
   - Backend PATCH request:
     - `PATCH /api/v1/admin/venues/:id/status` (for venue)
     - `PATCH /api/v1/admin/mobile-providers/:id/status` (for mobile provider)
     - Body: `{ "status": "APPROVED" }`

5. **Expected Outcomes:**
   - Venue/Provider status updated to APPROVED in DB
   - Card disappears from queue
   - Provider now visible in customer app discoveries
   - Logout button available in header

### Phase 4: Provider App After Approval

1. **Reopen Provider App** (same browser/device)
   - App launches and calls `restoreAuth()`
   - Loads cached auth tokens from AsyncStorage
   - Retrieves dashboard
   - **Expected:** Auto-redirects to `/(tabs)/dashboard` with active bookings

2. **Provider Auth Persistence**
   - Close and reopen app
   - Should still be logged in (auth restored from storage)
   - Dashboard loads without re-login required

### Phase 5: Customer Discovery

1. **Open Customer App** (http://localhost:3001)
   - Browse Featured or Search venues
   - Approved venue/provider now visible
   - **Expected:** Complete provider info, services, pricing displayed

2. **Professional Sign-in Link**
   - Tap Account tab → "Join as a Professional"
   - Opens zana.zm/provider or shows alert to install provider app
   - **Expected:** Clear path to provider portal visible

3. **Booking Flow** (if implemented)
   - Select approved provider → service → time slot
   - Complete booking
   - **Expected:** Booking created in DB with PENDING status
   - Provider receives notification in dashboard

---

## API Endpoint Validation

### Test Admin Approval Endpoints

**Get Pending Queue:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/queue \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "data": {
#     "pendingVenues": [...],
#     "pendingMobileProviders": [...],
#     "pagination": { "page": 1, "limit": 20, "totalVenues": 1, "totalMobile": 0, "totalPages": 1 }
#   }
# }
```

**Approve Venue:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/venues/:id/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "APPROVED" }'

# Expected Response: { "message": "Venue approved", "venue": { ... } }
```

**Approve Mobile Provider:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/mobile-providers/:id/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "APPROVED" }'

# Expected Response: { "message": "Mobile provider approved", "mobileProvider": { ... } }
```

### Test Provider Onboarding Endpoints

**Create Venue:**
```bash
curl -X POST http://localhost:3000/api/v1/venues \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zana's Salon",
    "description": "Premium salon",
    "category": "SALON",
    "phone": "260123456789",
    "address": "Plot 123, Downtown",
    "city": "Lusaka",
    "latitude": 15.3875,
    "longitude": 28.3228
  }'

# Expected: { "id": "venue-id", "status": "PENDING", ... }
```

**Create Service for Venue:**
```bash
curl -X POST http://localhost:3000/api/v1/venues/:venueId/services \
  -H "Authorization: Bearer <PROVIDER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Haircut",
    "description": "Professional cut",
    "category": "HAIRCUT",
    "price": 150,
    "duration": 30
  }'

# Expected: { "id": "service-id", "venueId": "...", ... }
```

---

## Authentication & Auth Persistence

### Expected Behavior

1. **First Login**
   - User enters credentials
   - Backend validates and returns accessToken + refreshToken
   - App stores both in AsyncStorage
   - User redirected to home screen

2. **App Restart**
   - App calls `restoreAuth()` on mount
   - Retrieves tokens from AsyncStorage
   - Sets `isAuthenticated = true`
   - Auto-redirects to home screen
   - **No login required** if tokens still valid

3. **Logout**
   - User taps logout
   - App clears all AsyncStorage keys
   - Auth state reset to null
   - Redirected to login screen

4. **Token Expiration** (future enhancement)
   - AccessToken expires after 15 minutes
   - App uses refreshToken to get new accessToken
   - If refreshToken expired, force re-login

---

## Role-Based Access Control

### Roles & Capabilities

| Role | Capabilities |
|------|--------------|
| **CUSTOMER** | Browse venues, make bookings, leave reviews |
| **PROVIDER_VENUE** | Create venue, add staff, manage services, accept bookings |
| **PROVIDER_MOBILE** | Create mobile profile, manage services, accept bookings |
| **ADMIN** | View approval queue, approve/reject venues & providers |

### Protected Routes

- **Provider App**: All routes after auth require `isAuthenticated = true`
- **Admin App**: All routes after auth require `isAuthenticated = true` + `role === 'ADMIN'`
- **Backend Endpoints**: All admin endpoints require `verifyToken` + `requireRole(['ADMIN'])`

---

## Common Testing Scenarios

### Scenario 1: Venue Owner Registration → Approval → Discovery

```
1. Provider App: Register as PROVIDER_VENUE
   → Business info → Services → Approval pending
2. Admin App: Login → Approve venue
3. Customer App: Search → See approved venue → Book service
```

**Expected Outcomes:**
- Venue created with PENDING status
- Admin can see and approve
- Venue becomes APPROVED and discoverable
- Customers can browse and book

### Scenario 2: Mobile Professional Registration → Approval → Discovery

```
1. Provider App: Register as PROVIDER_MOBILE
   → Service radius setup → Services → Approval pending
2. Admin App: Login → Approve mobile provider
3. Customer App: Search → See approved mobile professional → Book
```

**Expected Outcomes:**
- MobileProvider created with PENDING status
- Admin can see and approve
- Provider becomes APPROVED and location-discoverable
- Customers can book for home service

### Scenario 3: Multiple Admin Rejections

```
1. Admin App: See 2 pending venues
2. Reject first venue
3. Reject second venue
4. Queue refreshes, both disappear
5. Providers notified of rejection (email TBD)
```

**Expected Outcomes:**
- Venues remain in DB with REJECTED status
- Admin can re-review in future (optional admin filter)
- Providers can re-apply

---

## Troubleshooting

### Issue: App crashes on startup

**Solution:** Check AsyncStorage keys match between store and API client (e.g., `@provider_auth_user`)

### Issue: Provider not visible in customer app after approval

**Solution:** 
- Verify admin approval actually succeeded
- Check venue/provider status in DB is APPROVED
- Verify token is still valid (no expiration)

### Issue: Provider can't login after registration

**Solution:**
- Check password hash in DB is valid (bcrypt)
- Verify user role is correct (PROVIDER_VENUE or PROVIDER_MOBILE)
- Check JWT_SECRET in .env matches backend

### Issue: Admin approval button shows error

**Solution:**
- Verify admin role is ADMIN
- Check authorization header included with Bearer token
- Verify venue/provider ID in URL is correct
- Check endpoint typo in API client

---

## Performance & Scaling Notes

- **Queue Pagination:** Admin queue supports `page` and `limit` params for large datasets
- **Services Inclusion:** Queue endpoint includes services array for context
- **Concurrent Approvals:** Multiple admins can approve simultaneously (no locking)
- **Mobile Provider Discovery:** Location-based filtering requires coordinates (placeholder: Lusaka)

---

## Next Steps (Post-MVP)

1. **Email Notifications**
   - Provider registration confirmation
   - Approval/rejection notifications
   - Booking confirmations

2. **Payment Integration**
   - Stripe/Airtel Money for bookings
   - Provider payouts

3. **Advanced Search**
   - Map-based venue discovery
   - Service category filters
   - Rating/review sorting

4. **Booking Management**
   - Calendar view for providers
   - Rescheduling & cancellations
   - Reminder notifications

5. **Analytics**
   - Provider dashboard with performance metrics
   - Admin dashboard with platform insights

---

## Contact & Support

For issues or questions about the ZANA ecosystem:
- Backend: `designer/backend/`
- Apps: `designer/apps/{customer|provider|admin}/`
- Documentation: See STARTUP.md
