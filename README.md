# ZANA - Beauty at Your Fingertips

A comprehensive beauty booking marketplace for Zambia, connecting customers with salons, barbershops, and mobile beauty professionals.

## 🌟 Features

### Customer Features
- **Browse Venues** - Discover salons, barbershops, nail studios, and makeup studios
- **Mobile Professionals** - Book beauty services at your location
- **Smart Search** - Filter by category, rating, price, and location
- **Easy Booking** - 4-step booking wizard with real-time availability
- **Appointment Management** - View, cancel, and review past appointments
- **Reviews & Ratings** - Share your experiences

### Provider Features
- **Business Profile** - Showcase your services, photos, and amenities
- **Booking Management** - Accept, confirm, and manage appointments
- **Staff Management** - Add team members and manage schedules
- **Service Catalog** - Set prices and durations for all services
- **Availability Control** - Set opening hours and block unavailable times

## 🏗️ Tech Stack

### Frontend
- **React Native** with Expo Router
- **TypeScript** for type safety
- **Zustand** for state management
- **Expo** for development and deployment

### Backend
- **Node.js** with Express
- **Prisma** ORM
- **PostgreSQL** database
- **JWT** authentication
- **Zod** validation

## 📁 Project Structure

```
ZANA/
├── apps/
│   ├── customer/           # React Native Customer App
│   │   ├── app/
│   │   │   ├── (auth)/     # Login & Register
│   │   │   ├── (tabs)/     # Home, Search, Appointments, Account
│   │   │   ├── booking/    # 4-step booking wizard
│   │   │   ├── venue/      # Venue detail
│   │   │   └── provider/   # Provider detail
│   │   ├── services/       # API client
│   │   └── stores/         # Zustand stores
│   │
│   └── provider/           # React Native Provider App (scaffolded)
│
├── backend/                # Node.js API Server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth & validation
│   │   └── server.js       # Entry point
│   └── prisma/
│       └── schema.prisma   # Database schema
│
└── shared/                 # Shared types & constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn
- Expo CLI (for mobile development)

### 1. Clone the Repository

```bash
git clone https://github.com/Nathan30302/ZANA.git
cd ZANA
```

### 2. Set Up the Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npx prisma generate
npx prisma migrate dev --name init

# Start server
npm run dev
```

### 3. Set Up the Customer App

```bash
cd apps/customer
npm install

# Start development server
npx expo start
```

### 4. Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zana"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/me` | Get current user |

### Venues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/venues` | List venues (with filters) |
| GET | `/api/v1/venues/:id` | Get venue details |
| POST | `/api/v1/venues` | Create venue (Provider) |
| PUT | `/api/v1/venues/:id` | Update venue (Owner) |
| GET | `/api/v1/venues/:id/services` | Get venue services |
| GET | `/api/v1/venues/:id/availability` | Get available slots |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/bookings` | Get user bookings |
| POST | `/api/v1/bookings` | Create booking |
| PATCH | `/api/v1/bookings/:id/confirm` | Confirm booking |
| PATCH | `/api/v1/bookings/:id/cancel` | Cancel booking |
| PATCH | `/api/v1/bookings/:id/complete` | Complete booking |

## 🎨 Design System

### Colors
- **Primary Blue**: `#1A56DB`
- **White**: `#FFFFFF`
- **Success Green**: `#10B981`
- **Error Red**: `#EF4444`
- **Text Dark**: `#111827`
- **Text Gray**: `#6B7280`

### Typography
- **Headings**: Bold, 24-28px
- **Body**: Regular, 14-16px
- **Small**: Regular, 12px

## 📋 Database Schema

### Core Models
- **User** - All platform users (customers, providers, staff, admins)
- **Venue** - Physical salon/barbershop locations
- **MobileProvider** - Traveling beauty professionals
- **Service** - Bookable services with pricing
- **Staff** - Venue employees
- **Booking** - Customer appointments
- **Review** - Ratings and feedback
- **OpeningHours** - Venue business hours
- **Availability** - Staff/provider schedules

## 🔒 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Input validation with Zod
- Rate limiting (100 req/15min)
- CORS configuration
- SQL injection protection (Prisma ORM)

## 🇿🇲 Zambia-Specific Features

- **Currency**: ZMW (Zambian Kwacha) - Display as "K 250"
- **Phone Numbers**: +260 format supported
- **Locations**: Optimized for Lusaka and major cities
- **Mobile Money**: Ready for Airtel Money/MTN integration

## 📄 License

This project is proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

**Built with ❤️ for Zambia**