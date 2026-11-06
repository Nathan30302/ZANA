import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatZmw(amount: number) {
  return `K${amount.toLocaleString("en-ZM")}`;
}

/** Appointment times are in Lusaka, even if the phone is set somewhere else. */
export function lusakaTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function lusakaStamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    weekday: "short",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")}`;
}

export function lusakaDay(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatLusaka(date: Date) {
  return `${lusakaDay(date)} · ${lusakaTime(date)}`;
}

export function lusakaLongDay(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Zambia stays on UTC+2 all year, so a shop time is a fixed offset from UTC. */
const LUSAKA_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Calendar day in Lusaka, `yyyy-mm-dd`. */
export function lusakaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addLusakaDays(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return lusakaDateKey(new Date(Date.UTC(y, m - 1, d + days, 10, 0, 0)));
}

/** Sunday is 0, matching the shop hours stored on each professional. */
export function lusakaWeekdayIndex(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 10, 0, 0)).getUTCDay();
}

export function lusakaDayStart(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - LUSAKA_OFFSET_MS);
}

/** `09:00` on a Lusaka calendar day, as an absolute instant. */
export function lusakaInstant(dateKey: string, hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Date(lusakaDayStart(dateKey).getTime() + ((hh || 0) * 60 + (mm || 0)) * 60_000);
}

export function minutesLabel(total: number) {
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function lusakaMonthKey(date = new Date()) {
  return lusakaDateKey(date).slice(0, 7);
}

export function shiftLusakaMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  return lusakaDateKey(new Date(Date.UTC(y, m - 1 + delta, 1, 10, 0, 0))).slice(0, 7);
}

export function daysInLusakaMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function lusakaMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    month: "long",
    year: "numeric",
  }).format(lusakaInstant(`${monthKey}-01`, "12:00"));
}

const BOOKING_LABEL: Record<string, string> = {
  REQUESTED: "Waiting",
  ACCEPTED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Done",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function bookingLabel(status: string) {
  return BOOKING_LABEL[status] || status;
}

export function bookingTone(status: string): "rose" | "orange" | "stone" | "green" {
  if (status === "COMPLETED") return "green";
  if (status === "REQUESTED") return "orange";
  if (status === "ACCEPTED" || status === "IN_PROGRESS") return "rose";
  return "stone";
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
