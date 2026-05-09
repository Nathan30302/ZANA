# ZANA Quick Start Cheat Sheet

## 🚀 Launch Sequence (5 Steps)

### Step 1: Backend Setup (2 minutes)
```bash
cd ZANA/designer/backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET
npx prisma migrate deploy
npm start
# ✅ Server http://localhost:3000
```

### Step 2: Create Admin User (1 minute)
```bash
# Option A: Via Prisma seed
npx prisma db seed

# Option B: Direct DB
psql your_database_url
INSERT INTO "User" (id, email, phone, password, "firstName", "lastName", role, "isVerified", "isActive")
VALUES ('admin-1', 'admin@zana.zm', '260123456789', '$2a$12$HASH', 'Admin', 'System', 'ADMIN', true, true);
```

### Step 3: Provider App (1 minute)
```bash
cd ZANA/designer/apps/provider
npm start
# Select 'w' for web browser
# ✅ Opens http://localhost:3002
```

### Step 4: Admin App (1 minute)
```bash
cd ZANA/designer/apps/admin
npm start
# ✅ Opens http://localhost:3003
```

### Step 5: Customer App (1 minute)
```bash
cd ZANA/designer/apps/customer
npm start
# ✅ Opens http://localhost:3001
```

---

## 🧪 Test Workflow (10 minutes)

### Provider Registration Flow
```
1. Open http://localhost:3002
2. Tap "Don't have an account?"
3. Fill form: John Doe, john@example.com, +260123456789, password123
4. Select: "Salon Owner" (PROVIDER_VENUE)
5. Business name: "Zana's Salon"
6. Phone: +260123456789
7. Address: Lusaka
8. Service: "Haircut" ZMW 200, 30 minutes
9. Finish → See "Approval Pending"
```

### Admin Approval Flow
```
1. Open http://localhost:3003
2. Login: admin@zana.zm / admin123
3. See "Venues awaiting approval"
4. Find "Zana's Salon" card
5. Tap "Approve"
6. ✅ Card disappears, venue is APPROVED
```

### Customer Discovery
```
1. Open http://localhost:3001
2. Browse Featured or Search
3. See "Zana's Salon" now visible
4. Tap to view services
5. ✅ Full transparency from creation to discovery
```

---

## 📱 App Login Credentials

### Admin App
```
Email: admin@zana.zm
Password: admin123
```

### Provider App
```
Register new account or:
Create in registration flow
```

### Customer App
```
Register new account or:
Create in registration flow
```

---

## 🔑 Key URLs

| App | URL | Purpose |
|-----|-----|---------|
| Backend API | http://localhost:3000 | REST API server |
| Customer | http://localhost:3001 | Browse & book |
| Provider | http://localhost:3002 | Register & manage |
| Admin | http://localhost:3003 | Approve queue |

---

## 💾 Database

### Connection
```bash
# Check DATABASE_URL in .env
psql "postgresql://user:pass@localhost:5432/zana_db"
```

### Useful Queries
```sql
-- View pending venues
SELECT id, name, status FROM "Venue" WHERE status = 'PENDING';

-- View pending mobile providers
SELECT id, status FROM "MobileProvider" WHERE status = 'PENDING';

-- View approved venues
SELECT id, name FROM "Venue" WHERE status = 'APPROVED';

-- View all users by role
SELECT id, email, role FROM "User" ORDER BY role;

-- View services for venue
SELECT id, name, price FROM "Service" WHERE "venueId" = 'venue-id-here';

-- Clear all pending (reset for testing)
DELETE FROM "Venue" WHERE status = 'PENDING';
DELETE FROM "MobileProvider" WHERE status = 'PENDING';
```

---

## 🧬 Architecture at a Glance

```
┌─ Customer App (3001) ─────┐
│  • Browse approved venues  │
│  • Make bookings           │
│  • Professional sign-in    │
└────────────────────────────┘
            ↓ JWT Token
┌────────────────────────────────┐
│  Express Backend (3000)        │
│  • Auth (register/login)       │
│  • Admin approval workflow     │
│  • Bookings management         │
└────────────────────────────────┘
            ↑ JWT Token
        ┌─────┴─────┐
        ↓           ↓
   ┌─────────────────────────────┐   ┌────────────────────┐
   │ Provider App (3002)         │   │ Admin App (3003)   │
   │ • Register (choose type)    │   │ • View queue       │
   │ • Fill business info        │   │ • Approve/Reject   │
   │ • Add services              │   │ • Role-protected   │
   │ • Await approval            │   │                    │
   └─────────────────────────────┘   └────────────────────┘
```

---

## 🛠️ Troubleshooting

### "Cannot find module 'react'"
```bash
cd designer/apps/{app}
npm install
```

### "Database connection failed"
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running: brew services start postgresql
```

### "Backend not responding"
```bash
# Kill existing process: lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Restart: cd designer/backend && npm start
```

### "App won't approve vendor"
```bash
# Check admin token is valid
# Verify role is ADMIN in DB
# Check venue ID in URL matches DB
```

### "Lost login after app restart"
```bash
# Auth should persist via AsyncStorage
# If not: clear browser cache, restart app
```

---

## 🔄 API Endpoints (Quick Reference)

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
```

### Provider Management
```
POST   /venues                    (create venue)
POST   /mobile-providers          (create mobile provider)
GET    /venue/profile             (get my venue)
GET    /mobile-providers/profile  (get my mobile provider)
```

### Services
```
POST   /venues/:id/services
POST   /mobile-providers/:id/services
```

### Admin
```
GET    /admin/queue               (ADMIN only)
PATCH  /admin/venues/:id/status   (ADMIN only)
PATCH  /admin/mobile-providers/:id/status  (ADMIN only)
```

---

## 🧠 Mental Model

### Provider Journey
```
Decide role
  ↓
Register account
  ↓
Fill business details (creates Venue or MobileProvider with PENDING status)
  ↓
Add first service
  ↓
Status = PENDING (awaiting admin approval)
  ↓
[ADMIN APPROVES]
  ↓
Status = APPROVED (now visible in customer app)
  ↓
Receive bookings, manage business
```

### Admin Journey
```
Login as admin
  ↓
View approval queue (paginated)
  ↓
Review pending venues and mobile providers
  ↓
Approve: status → APPROVED (visible to customers)
or
Reject: status → REJECTED (not visible to customers)
```

### Customer Journey
```
Browse venue/professional (shows only APPROVED)
  ↓
Select service
  ↓
Choose time
  ↓
Book
  ↓
Receive confirmation
  ↓
Try professional
  ↓
Leave review
```

---

## 📊 Expected Database State

### After Provider Registration
```
User: { email: "provider@example.com", role: "PROVIDER_VENUE" }
Venue: { id: "venue-1", status: "PENDING", ownerId: "user-1" }
Service: { id: "service-1", venueId: "venue-1" }
```

### After Admin Approval
```
Venue: { id: "venue-1", status: "APPROVED", ownerId: "user-1" }
# Now queryable by customers
```

---

## 🎯 Validation Checklist

- [ ] Backend launches at localhost:3000
- [ ] Admin user exists in database
- [ ] Provider app opens at localhost:3002
- [ ] Admin app opens at localhost:3003
- [ ] Customer app opens at localhost:3001
- [ ] Can register provider with PROVIDER_VENUE
- [ ] Can register provider with PROVIDER_MOBILE
- [ ] Can see pending in admin queue
- [ ] Can approve and status updates
- [ ] Approved provider visible in customer app
- [ ] Auth persists after app restart
- [ ] Logout clears credentials

---

## 📝 Key Files

### Backend
```
designer/backend/
├── src/
│   ├── routes/
│   │   ├── admin.js          ← Admin approval endpoints
│   │   ├── auth.js           ← Registration/login
│   │   ├── services.js       ← Service creation
│   │   └── mobileProviders.js ← Mobile provider profile
│   └── server.js             ← All routes registered
└── prisma/
    └── schema.prisma         ← Database schema
```

### Provider App
```
designer/apps/provider/
├── app/
│   ├── (auth)/
│   │   ├── register.tsx      ← Type selection, registration
│   │   └── login.tsx
│   ├── onboarding/
│   │   ├── business.tsx      ← Creates profile, gets ID
│   │   ├── services.tsx      ← Uses ID to create service
│   │   └── complete.tsx      ← "Awaiting approval" screen
│   └── _layout.tsx           ← Restores auth on startup
├── stores/authStore.ts       ← Mobile provider support
└── services/api.ts           ← Routing logic for both types
```

### Admin App
```
designer/apps/admin/
├── app/
│   ├── (auth)/login.tsx      ← Admin login
│   ├── (tabs)/queue.tsx      ← Approval interface
│   └── _layout.tsx           ← Restores auth on startup
├── stores/authStore.ts       ← Admin auth store
└── services/api.ts           ← Admin API client
```

---

## 🌟 Pro Tips

1. **Test Both Provider Types**: Test PROVIDER_VENUE and PROVIDER_MOBILE flows separately
2. **Check DB Between Steps**: Use `SELECT * FROM "Venue" WHERE status = 'PENDING'` to verify data
3. **Clear AsyncStorage**: Developer tools → Application → Local Storage → Clear
4. **Monitor Logs**: Watch backend console for API calls and errors
5. **Token Debugging**: Copy Bearer token and test endpoints manually with curl
6. **DB Inspection**: Use web client: Adminer, pgAdmin, DataGrip

---

## 🚀 Next Steps After MVP Testing

1. **Email Notifications**: Provider gets notified on approval/rejection
2. **Payment Integration**: Accept payment for bookings
3. **Map UI**: Show venues on map, location-based search
4. **Booking Calendar**: Providers see calendar of bookings
5. **Reviews & Ratings**: Customers rate after service
6. **Real-time Notifications**: Push notifications for bookings
7. **Analytics Dashboard**: Admin views business metrics
8. **Scalability**: Move to cloud, add caching, optimize queries

---

## 📞 Support References

**Documentation:**
- STARTUP.md - Complete setup guide  
- ECOSYSTEM_VALIDATION.md - Testing workflows
- IMPLEMENTATION_SUMMARY.md - Technical details

**Code Reference:**
- Backend routes: `designer/backend/src/routes/`
- Auth middleware: `designer/backend/src/middleware/auth.js`
- API clients: `designer/apps/*/services/api.ts`
- Auth stores: `designer/apps/*/stores/authStore.ts`

**Quick Links:**
- Backend health: http://localhost:3000/health
- API reference in STARTUP.md under "API Endpoints"

---

**Last Updated:** Session completion
**Status:** Ready for local testing ✅
