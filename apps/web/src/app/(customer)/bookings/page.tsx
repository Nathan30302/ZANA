"use client";

import { Badge, Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { appointmentIsUpcoming, bookingLabel, bookingTone, formatZmw, lusakaTime, lusakaUntil, lusakaWhen } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  locationType: string;
  servicePriceZmw: number;
  travelFeeZmw: number;
  service: { id: string; name: string; durationMin: number };
  professional: { id: string; displayName: string; coverUrl: string | null };
  review: { id: string } | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api<{ bookings: Booking[] }>("/api/bookings?scope=customer");
      setBookings(data.bookings);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please log in");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const rows = bookings.filter((b) =>
      tab === "upcoming"
        ? appointmentIsUpcoming(b.status, b.scheduledAt, b.service.durationMin)
        : !appointmentIsUpcoming(b.status, b.scheduledAt, b.service.durationMin),
    );
    return rows.sort((a, b) => {
      const delta = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return tab === "upcoming" ? delta : -delta;
    });
  }, [bookings, tab]);

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Bookings" />
      <div className="flex rounded-2xl bg-stone-100 p-1">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize ${
              tab === t ? "bg-white shadow-sm" : "text-stone-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState title="Sign in to see bookings" body={`${error}. Use demo phone +260970000010 / OTP 123456.`} />
      ) : filtered.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            title={bookings.length === 0 ? "No bookings yet" : tab === "upcoming" ? "Nothing coming up" : "Nothing finished yet"}
            body={
              bookings.length === 0
                ? "Explore pros and book your first service."
                : tab === "upcoming"
                  ? "Finished visits are under Past. Book again from there."
                  : "A visit shows here after it is done."
            }
          />
          {tab === "upcoming" ? (
            <Link href="/explore">
              <Button className="w-full">Find someone</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const passed =
              !appointmentIsUpcoming(b.status, b.scheduledAt, b.service.durationMin) &&
              ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(b.status);
            const when = new Date(b.scheduledAt);
            const until = lusakaUntil(when);
            return (
              <Card key={b.id} className="space-y-3 p-3">
                <Link href={`/bookings/${b.id}`} className="flex items-start gap-3">
                  <div className="w-14 shrink-0 pt-0.5 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      {lusakaWhen(when)}
                    </div>
                    <div className="font-display text-xl leading-none text-stone-900">{lusakaTime(when)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-stone-900">{b.service.name}</div>
                        <div className="truncate text-sm text-stone-500">{b.professional.displayName}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-stone-900">
                          {formatZmw(b.servicePriceZmw + b.travelFeeZmw)}
                        </div>
                        <div className="mt-1">
                          <Badge tone={passed ? "stone" : bookingTone(b.status)}>
                            {passed && b.status === "REQUESTED"
                              ? "Not confirmed"
                              : passed && b.status === "ACCEPTED"
                                ? "Missed"
                                : bookingLabel(b.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-stone-500">
                      {b.locationType === "AT_HOME" ? "At your home" : "At the shop"}
                      {until ? ` · ${until}` : ""}
                      {passed ? " · This time has passed" : ""}
                    </div>
                  </div>
                </Link>
                <div className="flex justify-end gap-3 text-sm font-semibold text-rose-800">
                  {appointmentIsUpcoming(b.status, b.scheduledAt, b.service.durationMin) ? (
                    <Link href={`/bookings/${b.id}/track`}>Route</Link>
                  ) : (
                    <Link href={`/pros/${b.professional.id}/book?service=${b.service.id}`}>Book again</Link>
                  )}
                  {b.status === "COMPLETED" && !b.review ? (
                    <Link href={`/bookings/${b.id}/review`}>Rate</Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
