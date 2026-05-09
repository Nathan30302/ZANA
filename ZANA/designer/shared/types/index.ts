// User Types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'CUSTOMER' | 'PROVIDER_MOBILE' | 'PROVIDER_VENUE' | 'STAFF' | 'ADMIN';

// Venue Types
export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  category: VenueCategory;
  phone: string;
  email?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  coverPhoto?: string;
  photos: string[];
  status: VenueStatus;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type VenueCategory = 'SALON' | 'BARBERSHOP' | 'NAIL_STUDIO' | 'MAKEUP_STUDIO';
export type VenueStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

// Mobile Provider Types
export interface MobileProvider {
  id: string;
  userId: string;
  bio?: string;
  portfolioPhotos: string[];
  baseLat: number;
  baseLng: number;
  serviceRadius: number;
  status: VenueStatus;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: Date;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  isActive: boolean;
  venueId?: string;
  mobileProviderId?: string;
}

export type ServiceCategory = 
  | 'HAIRCUT' 
  | 'HAIR_STYLING' 
  | 'BRAIDING' 
  | 'LOCS' 
  | 'WEAVE'
  | 'BEARD_TRIM' 
  | 'SHAVE' 
  | 'NAILS' 
  | 'MAKEUP' 
  | 'EYEBROWS';

// Staff Types
export interface Staff {
  id: string;
  userId: string;
  venueId: string;
  title?: string;
  avatarUrl?: string;
  isActive: boolean;
}

// Availability Types
export interface Availability {
  id: string;
  staffId?: string;
  mobileProviderId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
}

// Opening Hours Types
export interface OpeningHours {
  id: string;
  venueId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// Booking Types
export interface Booking {
  id: string;
  reference: string;
  customerId: string;
  serviceId: string;
  venueId?: string;
  mobileProviderId?: string;
  staffId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  serviceMode: ServiceMode;
  notes?: string;
  clientAddress?: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ServiceMode = 'SALON_VISIT' | 'BARBERSHOP_VISIT' | 'MOBILE';

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  venueId?: string;
  mobileProviderId?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface DistanceMatrixResponse {
  distance: number; // in meters
  duration: number; // in seconds
}

// Search Types
export interface SearchFilters {
  category?: VenueCategory;
  minRating?: number;
  maxPrice?: number;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number; // in kilometers
}

// Notification Types
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Form Types
export interface ServiceFormData {
  name: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  duration: number;
}

export interface VenueFormData {
  name: string;
  description?: string;
  category: VenueCategory;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
  amenities: string[];
}

export interface MobileProviderFormData {
  bio?: string;
  baseLat: number;
  baseLng: number;
  serviceRadius: number;
}

// Constants for Zambia
export const ZAMBIA_REGIONS = [
  'Lusaka',
  'Copperbelt',
  'Southern',
  'Northern',
  'Eastern',
  'Western',
  'North-Western',
  'Luapula',
  'Muchinga',
  'Central'
] as const;

export const ZAMBIA_CITIES = [
  'Lusaka',
  'Kitwe',
  'Ndola',
  'Livingstone',
  'Kabwe',
  'Chipata',
  'Chingola',
  'Mufulira',
  'Luanshya',
  'Solwezi'
] as const;

export const CURRENCY_SYMBOL = 'K';
export const CURRENCY_CODE = 'ZMW';