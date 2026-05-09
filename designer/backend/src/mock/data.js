const { randomUUID } = require('crypto');

// Minimal, realistic demo dataset for dev when DB is unavailable.
// IDs are stable-ish for a single process lifetime.

const lusaka = { lat: -15.4089, lng: 28.2815 };

const venues = [
  {
    id: 'venue_demo_1',
    ownerId: 'user_provider_1',
    name: 'Kutz by Daka',
    slug: 'kutz-by-daka',
    description: 'Premium barbering with modern styles.',
    category: 'BARBERSHOP',
    phone: '0971234567',
    email: 'kutz@example.com',
    address: 'Great East Road',
    city: 'Lusaka',
    latitude: lusaka.lat + 0.01,
    longitude: lusaka.lng + 0.01,
    coverPhoto: null,
    photos: [],
    status: 'APPROVED',
    rating: 4.7,
    reviewCount: 128,
    isVerified: true,
    amenities: ['Wi‑Fi', 'Card payments', 'Parking'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mobileProviders = [
  {
    id: 'provider_demo_1',
    userId: 'user_mobile_1',
    bio: 'Mobile grooming—home & office visits.',
    portfolioPhotos: [],
    baseLat: lusaka.lat - 0.015,
    baseLng: lusaka.lng + 0.02,
    serviceRadius: 12,
    status: 'APPROVED',
    rating: 4.8,
    reviewCount: 64,
    isVerified: true,
    createdAt: new Date().toISOString(),
    user: {
      id: 'user_mobile_1',
      firstName: 'Chanda',
      lastName: 'Phiri',
      avatarUrl: null,
      email: 'chanda@example.com',
    },
  },
];

const services = [
  {
    id: 'service_demo_1',
    name: 'Haircut & Style',
    description: 'Consultation, cut, finishing.',
    category: 'HAIRCUT',
    price: 250,
    duration: 45,
    isActive: true,
    venueId: 'venue_demo_1',
    mobileProviderId: null,
  },
  {
    id: 'service_demo_2',
    name: 'Beard Trim',
    description: 'Precision trim + line up.',
    category: 'BEARD_TRIM',
    price: 120,
    duration: 20,
    isActive: true,
    venueId: 'venue_demo_1',
    mobileProviderId: null,
  },
  {
    id: 'service_demo_3',
    name: 'Mobile Haircut',
    description: 'Professional mobile haircut at your location.',
    category: 'HAIRCUT',
    price: 300,
    duration: 50,
    isActive: true,
    venueId: null,
    mobileProviderId: 'provider_demo_1',
  },
];

const staff = [
  {
    id: 'staff_demo_1',
    userId: 'user_staff_1',
    venueId: 'venue_demo_1',
    title: 'Senior Barber',
    isActive: true,
    user: { id: 'user_staff_1', firstName: 'John', lastName: 'Mumba', avatarUrl: null },
  },
];

const openingHours = [
  { id: 'oh_1', venueId: 'venue_demo_1', dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { id: 'oh_2', venueId: 'venue_demo_1', dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { id: 'oh_3', venueId: 'venue_demo_1', dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { id: 'oh_4', venueId: 'venue_demo_1', dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { id: 'oh_5', venueId: 'venue_demo_1', dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
  { id: 'oh_6', venueId: 'venue_demo_1', dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isClosed: false },
  { id: 'oh_7', venueId: 'venue_demo_1', dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },
];

module.exports = {
  venues,
  mobileProviders,
  services,
  staff,
  openingHours,
  lusaka,
  randomUUID,
};

