"use client";

import { PlaceMap } from "@/components/map-screen";
import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api-client";
import { bookingLabel, bookingTone, formatLusaka, formatZmw, lusakaLongDay, lusakaTime, whatsappHref } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  locationType: string;
  address: string | null;
  customerLat: number | null;
  customerLng: number | null;
  servicePriceZmw: number;
  travelFeeZmw: number;
  customerNote: string | null;
  service: { name: string; durationMin: number };
  professional: {
    id: string;
    displayName: string;
    coverUrl: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    area: string | null;
    user: { phone: string };
  };
  review: { id: string } | null;
};

function statusLine(status: string, name: string) {
  if (status === "REQUESTED") return `Waiting for ${name} to confirm.`;
  if (status === "ACCEPTED") return `${name} confirmed this.`;
  if (status === "IN_PROGRESS") return `${name} has started.`;
  if (status === "COMPLETED") return "This appointment is done.";
  if (status === "DECLINED") return `${name} couldn't take this one.`;
  if (status === "CANCELLED") return "This booking was cancelled.";
  if (status === "EXPIRED") return "This request expired.";
  return "";
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [askCancel, setAskCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<{ booking: Booking }>(`/api/bookings/${id}`);
    setBooking(data.booking);
  }

  useEffect(() => {
    load().catch(() => router.push("/login"));
  }, [id, router]);

  async function cancel() {
    setBusy(true);
    try {
      await api(`/api/bookings/${id}`, { method: "PATCH", json: { status: "CANCELLED" } });
      setAskCancel(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function openChat() {
    if (!booking) return;
    setBusy(true);
    try {
      const data = await api<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        json: { professionalId: booking.professional.id },
      });
      router.push(`/messages/${data.conversation.id}`);
    } catch {
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!booking) return <div className="mobile-shell p-6 text-sm text-stone-500">Loading…</div>;

  const when = new Date(booking.scheduledAt);
  const atHome = booking.locationType === "AT_HOME";
  const place =
    atHome && booking.customerLat != null && booking.customerLng != null
      ? { lat: booking.customerLat, lng: booking.customerLng, label: "You" }
      : booking.professional.lat != null && booking.professional.lng != null
        ? {
            lat: booking.professional.lat,
            lng: booking.professional.lng,
            label: booking.professional.displayName,
          }
        : null;
  const where = atHome
    ? booking.address || "They come to you"
    : booking.professional.address || booking.professional.area || "At the shop";
  const total = booking.servicePriceZmw + booking.travelFeeZmw;
  const active = ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(booking.status);

  return (
    <div className="mobile-shell pb-10">
      <div className="relative h-48 overflow-hidden bg-stone-900">
        {booking.professional.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={booking.professional.coverUrl} alt="" className="h-full w-full object-cover opacity-80" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-stone-950/30" />
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-stone-800"
        >
          Back
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <Badge tone={bookingTone(booking.status)}>{bookingLabel(booking.status)}</Badge>
          <h1 className="font-display mt-2 text-3xl leading-none">{booking.service.name}</h1>
          <p className="mt-1 text-sm text-white/80">{booking.professional.displayName}</p>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <Card className="flex items-center gap-4">
          <div className="w-20 shrink-0 text-center">
            <div className="font-display text-3xl leading-none text-stone-900">{lusakaTime(when)}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400">Lusaka</div>
          </div>
          <div className="min-w-0 border-l border-stone-100 pl-4">
            <div className="font-semibold text-stone-900">{lusakaLongDay(when)}</div>
            <div className="mt-1 text-sm text-stone-500">
              {booking.service.durationMin} min · {atHome ? "They come to you" : "You go to the shop"}
            </div>
            <div className="mt-1 text-sm text-stone-600">{where}</div>
          </div>
        </Card>

        <p className="text-sm text-stone-600">{statusLine(booking.status, booking.professional.displayName)}</p>

        <Card className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{booking.service.name}</span>
            <span>{formatZmw(booking.servicePriceZmw)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Travel</span>
            <span>{formatZmw(booking.travelFeeZmw)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatZmw(total)}</span>
          </div>
          {booking.customerNote ? <div className="pt-1 text-stone-500">Note: {booking.customerNote}</div> : null}
        </Card>

        {place ? <PlaceMap place={place} /> : null}

        <div className="flex flex-col gap-2">
          {active ? (
            <Link href={`/bookings/${booking.id}/track`}>
              <Button className="w-full">Route me</Button>
            </Link>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={busy} onClick={openChat}>
              Message
            </Button>
            <a
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              href={whatsappHref(
                booking.professional.user.phone,
                `Hi ${booking.professional.displayName}, about my ${booking.service.name} on ${formatLusaka(when)}.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
          <Link href={`/pros/${booking.professional.id}`}>
            <Button variant="secondary" className="w-full">
              View {booking.professional.displayName}
            </Button>
          </Link>
          {booking.status === "COMPLETED" && !booking.review ? (
            <Link href={`/bookings/${booking.id}/review`}>
              <Button className="w-full">Rate this visit</Button>
            </Link>
          ) : null}
          {booking.review ? <p className="text-center text-sm text-stone-500">You already rated this visit.</p> : null}
          {["REQUESTED", "ACCEPTED"].includes(booking.status) ? (
            askCancel ? (
              <Card className="space-y-3">
                <div className="font-semibold">Cancel this {booking.service.name.toLowerCase()}?</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setAskCancel(false)}>
                    Keep it
                  </Button>
                  <Button variant="danger" disabled={busy} onClick={cancel}>
                    {busy ? "Cancelling…" : "Cancel it"}
                  </Button>
                </div>
              </Card>
            ) : (
              <button
                type="button"
                onClick={() => setAskCancel(true)}
                className="py-2 text-sm font-semibold text-stone-500"
              >
                Cancel booking
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
