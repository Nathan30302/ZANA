"use client";

import { Badge, Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { appointmentIsUpcoming, bookingLabel, bookingTone, formatZmw, lusakaTime, lusakaWhen } from "@/lib/utils";
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
            return (
              <Card key={b.id} className="space-y-3">
                <Link href={`/bookings/${b.id}`} className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.professional.coverUrl || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&q=80"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                          {lusakaWhen(new Date(b.scheduledAt))} · {lusakaTime(new Date(b.scheduledAt))}
                        </div>
                        <div className="truncate font-semibold text-stone-900">{b.service.name}</div>
                        <div className="truncate text-sm text-stone-500">{b.professional.displayName}</div>
                      </div>
                      <Badge tone={bookingTone(b.status)}>{bookingLabel(b.status)}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-stone-500">
                      {b.locationType === "AT_HOME" ? "At your home" : "At the shop"}
                      {passed ? " · This time has passed" : ""}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{formatZmw(b.servicePriceZmw + b.travelFeeZmw)}</span>
                  <div className="flex gap-3 text-sm font-semibold text-rose-800">
                    <Link href={`/bookings/${b.id}`}>Details</Link>
                    {appointmentIsUpcoming(b.status, b.scheduledAt, b.service.durationMin) ? (
                      <Link href={`/bookings/${b.id}/track`}>Route</Link>
                    ) : (
                      <Link href={`/pros/${b.professional.id}/book?service=${b.service.id}`}>Book again</Link>
                    )}
                    {b.status === "COMPLETED" && !b.review ? (
                      <Link href={`/bookings/${b.id}/review`}>Rate</Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
