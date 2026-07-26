/** Shared domain enums & constants for ZANA API + web. */

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum ProviderType {
  INDEPENDENT = 'INDEPENDENT',
  SALON = 'SALON',
  BARBERSHOP = 'BARBERSHOP',
}

export enum ProviderApplicationStatus {
  PENDING = 'PENDING',
  NEEDS_INFO = 'NEEDS_INFO',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  ON_THE_WAY = 'ON_THE_WAY',
  CONFIRMED = 'CONFIRMED',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  RATED = 'RATED',
}

export enum ServiceCategory {
  BARBER = 'BARBER',
  SALON = 'SALON',
  NAILS = 'NAILS',
  BRIDAL = 'BRIDAL',
  MOBILE = 'MOBILE',
}

export enum ServiceMode {
  AT_SHOP = 'AT_SHOP',
  COMES_TO_YOU = 'COMES_TO_YOU',
}

export const FLOAT_PACKAGES = [
  { code: 'STARTER', name: 'Starter', credits: 10 },
  { code: 'PRO', name: 'Pro', credits: 30 },
  { code: 'ELITE', name: 'Elite', credits: 100 },
] as const;

export const LUSAKA_AREAS = [
  'Roma',
  'Kabulonga',
  'CBD',
  'Woodlands',
  'Rhodes Park',
  'Olympia',
  'Chilanga',
  'Chelstone',
  'Matero',
  'Chilenje',
] as const;

export const API_PREFIX = 'v1';
