"use client";

import { Badge, Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { bookingLabel, bookingTone, lusakaTime } from "@/lib/utils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  service: { name: string };
  customer: { name: string | null };
};

export default function ProCalendarPage() {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    api<{ bookings: Booking[] }>("/api/bookings?scope=pro")
      .then((d) => setBookings(d.bookings))
      .catch(() => setBookings([]));
  }, []);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  }, [month]);

  const bookedDays = useMemo(() => {
    return new Set(bookings.map((b) => format(new Date(b.scheduledAt), "yyyy-MM-dd")));
  }, [bookings]);

  const dayBookings = bookings.filter((b) => isSameDay(new Date(b.scheduledAt), selected));

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Calendar" />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setMonth(addMonths(month, -1))} className="text-sm font-semibold">
            Prev
          </button>
          <div className="font-semibold">{format(month, "MMMM yyyy")}</div>
          <button onClick={() => setMonth(addMonths(month, 1))} className="text-sm font-semibold">
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-stone-500">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: startOfMonth(month).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const active = isSameDay(day, selected);
            const has = bookedDays.has(key);
            return (
              <button
                key={key}
                onClick={() => setSelected(day)}
                className={`relative rounded-xl py-2 text-sm ${
                  active ? "bg-rose-800 text-white" : isSameMonth(day, month) ? "bg-stone-50" : ""
                }`}
              >
                {format(day, "d")}
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
        <h2 className="mb-3 font-semibold">{format(selected, "EEEE d MMM")}</h2>
        <div className="space-y-2">
          {dayBookings.length === 0 ? (
            <Card className="text-sm text-stone-500">No appointments. Manage hours in Profile → Availability.</Card>
          ) : (
            dayBookings.map((b) => (
              <Card key={b.id} className="flex items-center justify-between text-sm">
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
