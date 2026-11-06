"use client";

import { Badge, Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import {
  bookingLabel,
  bookingTone,
  daysInLusakaMonth,
  lusakaDateKey,
  lusakaInstant,
  lusakaLongDay,
  lusakaMonthKey,
  lusakaMonthLabel,
  lusakaTime,
  lusakaWeekdayIndex,
  shiftLusakaMonth,
} from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  service: { name: string };
  customer: { name: string | null };
};

export default function ProCalendarPage() {
  const [month, setMonth] = useState(lusakaMonthKey);
  const [selected, setSelected] = useState(lusakaDateKey);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const todayKey = lusakaDateKey();

  useEffect(() => {
    api<{ bookings: Booking[] }>("/api/bookings?scope=pro")
      .then((d) => setBookings(d.bookings))
      .catch(() => setBookings([]));
  }, []);

  const bookedDays = useMemo(() => {
    return new Set(bookings.map((b) => lusakaDateKey(new Date(b.scheduledAt))));
  }, [bookings]);

  const count = daysInLusakaMonth(month);
  const firstDow = lusakaWeekdayIndex(`${month}-01`);
  const dayBookings = bookings.filter((b) => lusakaDateKey(new Date(b.scheduledAt)) === selected);

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Calendar" />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setMonth(shiftLusakaMonth(month, -1))} className="text-sm font-semibold">
            Prev
          </button>
          <div className="font-semibold">{lusakaMonthLabel(month)}</div>
          <button onClick={() => setMonth(shiftLusakaMonth(month, 1))} className="text-sm font-semibold">
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-stone-500">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: count }).map((_, i) => {
            const key = `${month}-${String(i + 1).padStart(2, "0")}`;
            const active = key === selected;
            const has = bookedDays.has(key);
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`relative rounded-xl py-2 text-sm ${
                  active ? "bg-rose-800 text-white" : isToday ? "bg-rose-50 text-rose-900" : "bg-stone-50"
                }`}
              >
                {i + 1}
                {has ? (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      active ? "bg-white" : "bg-rose-700"
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">{lusakaLongDay(lusakaInstant(selected, "12:00"))}</h2>
        <div className="space-y-2">
          {dayBookings.length === 0 ? (
            <Card className="text-sm text-stone-500">No appointments. Manage hours in Profile → Availability.</Card>
          ) : (
            dayBookings.map((b) => (
              <Card key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{b.service.name}</div>
                  <div className="text-stone-500">
                    {lusakaTime(new Date(b.scheduledAt))} · {b.customer.name || "Customer"}
                  </div>
                </div>
                <Badge tone={bookingTone(b.status)}>{bookingLabel(b.status)}</Badge>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
