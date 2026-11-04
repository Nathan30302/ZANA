import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatZmw(amount: number) {
  return `K${amount.toLocaleString("en-ZM")}`;
}

export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+260")) return digits;
  if (digits.startsWith("260")) return `+${digits}`;
  if (digits.startsWith("0")) return `+260${digits.slice(1)}`;
  if (digits.length === 9) return `+260${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Rough Lusaka drive time from distance (about 22 km/h in traffic). */
export function driveMinutes(distanceKm: number) {
  return Math.max(3, Math.round((distanceKm / 22) * 60));
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
