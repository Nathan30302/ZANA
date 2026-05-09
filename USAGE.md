# ZANA - Beauty & Wellness Booking Platform

## Overview

ZANA is a comprehensive beauty and wellness booking marketplace that connects customers with beauty service providers. The platform consists of two mobile applications (Customer and Provider) and a backend API that handles all business logic, authentication, and data management.

## Architecture

- **Backend**: Node.js/Express API with Prisma ORM and PostgreSQL database
- **Customer App**: React Native (Expo) application for booking services
- **Provider App**: React Native (Expo) application for managing business operations
- **Admin App**: React Native (Expo) application for approval workflows and queue management
- **Authentication**: JWT-based authentication system
- **Payments**: Integrated payment processing
- **File Upload**: Cloud storage for images and documents

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Expo CLI for mobile development
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd designer/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Configure database connection and other environment variables

4. **Database Setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

The backend will run on `http://localhost:3000`

### Mobile Apps Setup

#### Customer App

1. **Navigate to customer app:**
   ```bash
   cd designer/apps/customer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npx expo start
   ```

#### Provider App

1. **Navigate to provider app:**
   ```bash
   cd designer/apps/provider
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npx expo start
   ```

#### Admin App

1. **Navigate to admin app:**
   ```bash
   cd designer/apps/admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npx expo start
   ```

## User Workflows

### Provider Registration & Setup

1. **Download Provider App**
   - Install the ZANA Provider app from the app store

2. **Create Account**
   - Open the app and tap "Sign Up"
   - Enter business information:
     - Business name
     - Contact details
     - Service categories (hair, nails, massage, etc.)
     - Business address or mobile service areas

3. **Business Profile Setup**
   - Upload business photos and logo
   - Set business hours and availability
   - Add service menu with pricing
   - Configure staff members (if applicable)

4. **Service Configuration**
   - Add individual services with:
     - Service name and description
     - Duration and pricing
     - Required staff qualifications
     - Equipment needed

5. **Staff Management**
   - Add team members
   - Assign services to staff
   - Set individual availability schedules

6. **Verification Process**
   - Submit business documents for verification
   - Wait for admin approval
   - Once approved, business goes live

### Customer Booking Flow

1. **Download Customer App**
   - Install the ZANA Customer app

2. **Create Account**
   - Sign up with email/phone and basic profile info

3. **Browse Services**
   - Search for services by:
     - Location (address or current location)
     - Service type (haircut, massage, etc.)
     - Provider name
     - Price range
     - Ratings and reviews

4. **Select Provider**
   - View provider profiles with:
     - Photos and descriptions
     - Service menu and pricing
     - Staff information
     - Customer reviews
     - Availability calendar

5. **Book Appointment**
   - Choose service and staff member
   - Select date and time from available slots
   - Add special requests or notes
   - Review booking details and pricing

6. **Payment**
   - Secure payment processing
   - Support for multiple payment methods
   - Booking confirmation with details

7. **Appointment Management**
   - View upcoming bookings
   - Reschedule or cancel appointments
   - Receive reminders and updates
   - Rate and review completed services

### Provider Operations

1. **Dashboard Overview**
   - Daily schedule view
   - Revenue tracking
   - Customer statistics
   - Pending bookings

2. **Booking Management**
   - Accept/reject booking requests
   - Manage appointment schedule
   - Handle rescheduling requests
   - Process cancellations

3. **Service Updates**
   - Modify service offerings
   - Update pricing
   - Change availability
   - Add new staff or services

4. **Customer Communication**
   - Respond to customer inquiries
   - Send booking confirmations
   - Handle special requests

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh

### Venues & Providers
- `GET /api/v1/venues` - Search venues by location
- `GET /api/v1/venue/:id` - Get venue details
- `POST /api/v1/venue` - Create venue profile
- `PUT /api/v1/venue/:id` - Update venue profile

### Services
- `GET /api/v1/services` - List services
- `POST /api/v1/services` - Create service
- `PUT /api/v1/services/:id` - Update service

### Bookings
- `GET /api/v1/bookings` - Get user bookings
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking status

### Staff Management
- `GET /api/v1/staff` - List staff members
- `POST /api/v1/staff` - Add staff member
- `PUT /api/v1/staff/:id` - Update staff details

## Development Guidelines

### Code Structure
- Backend: Express.js with modular routing
- Frontend: React Native with Expo Router
- State Management: Zustand for both apps
- Styling: NativeWind (Tailwind CSS for React Native)

### Testing
- Backend: Jest for unit and integration tests
- Mobile: Jest and React Native Testing Library

### Deployment
- Backend: Docker containerization
- Mobile: Expo Application Services (EAS)
- Database: PostgreSQL with connection pooling

## Support

For technical support or questions:
- Check the README.md files in each component
- Review API documentation
- Contact the development team

## License

This project is proprietary software. All rights reserved.