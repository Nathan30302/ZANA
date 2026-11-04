import { addMinutes, format, getDay, isBefore, startOfDay } from "date-fns";
import { prisma } from "./prisma";
import { BookingStatus, LocationType } from "@prisma/client";

export async function getSettings() {
  const existing = await prisma.platformSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.platformSettings.create({
    data: { id: 1, commissionPercent: 12, homeCommissionPercent: 10, minFloatZmw: 50 },
  });
}

export async function getAvailableSlots(professionalId: string, dateIso: string, durationMin: number) {
  const day = startOfDay(new Date(dateIso));
  const dow = getDay(day);
  const hours = await prisma.workingHour.findUnique({
    where: { professionalId_dayOfWeek: { professionalId, dayOfWeek: dow } },
  });
  if (!hours || !hours.enabled) return [];

  const bookings = await prisma.booking.findMany({
    where: {
      professionalId,
      scheduledAt: {
        gte: day,
        lt: addMinutes(day, 24 * 60),
      },
      status: { in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS] },
    },
  });

  const slots: string[] = [];
  for (let m = hours.startMin; m + durationMin <= hours.endMin; m += 30) {
    const slotStart = addMinutes(day, m);
    if (isBefore(slotStart, new Date())) continue;
    const slotEnd = addMinutes(slotStart, durationMin);
    const overlaps = bookings.some((b) => {
      const bStart = b.scheduledAt;
      // assume 60 min if unknown — use service duration via join would be better; approximate 60
      const bEnd = addMinutes(bStart, 60);
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (!overlaps) slots.push(format(slotStart, "HH:mm"));
  }
  return slots;
}

export function calcTotals(opts: {
  servicePriceZmw: number;
  travelFeeZmw: number;
  locationType: LocationType;
  commissionPercent: number;
  homeCommissionPercent: number;
}) {
  const travel = opts.locationType === LocationType.AT_HOME ? opts.travelFeeZmw : 0;
  const total = opts.servicePriceZmw + travel;
  const rate =
    opts.locationType === LocationType.AT_HOME
      ? opts.homeCommissionPercent
      : opts.commissionPercent;
  const commissionZmw = Math.round(opts.servicePriceZmw * (rate / 100));
  return { travelFeeZmw: travel, totalZmw: total, commissionZmw, rate };
}
