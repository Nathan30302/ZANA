import { BookingStatus, LocationType } from "@prisma/client";
import { prisma } from "./prisma";
import { lusakaDayStart, lusakaWeekdayIndex, minutesLabel } from "./utils";

export async function getSettings() {
  const existing = await prisma.platformSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.platformSettings.create({
    data: { id: 1, commissionPercent: 12, homeCommissionPercent: 10, minFloatZmw: 50 },
  });
}

export async function getAvailableSlots(professionalId: string, dateIso: string, durationMin: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return [];
  const day = lusakaDayStart(dateIso);
  const dow = lusakaWeekdayIndex(dateIso);
  const hours = await prisma.workingHour.findUnique({
    where: { professionalId_dayOfWeek: { professionalId, dayOfWeek: dow } },
  });
  if (!hours || !hours.enabled) return [];

  const bookings = await prisma.booking.findMany({
    where: {
      professionalId,
      scheduledAt: {
        gte: day,
        lt: new Date(day.getTime() + 24 * 60 * 60 * 1000),
      },
      status: { in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS] },
    },
  });

  const slots: string[] = [];
  const now = Date.now();
  for (let m = hours.startMin; m + durationMin <= hours.endMin; m += 30) {
    const slotStart = new Date(day.getTime() + m * 60_000);
    if (slotStart.getTime() <= now) continue;
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);
    const overlaps = bookings.some((b) => {
      const bStart = b.scheduledAt.getTime();
      const bEnd = bStart + 60 * 60_000;
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });
    if (!overlaps) slots.push(minutesLabel(m));
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
