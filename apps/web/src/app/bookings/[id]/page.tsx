"use client";

import { PlaceMap } from "@/components/map-screen";
import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api-client";
import {
  appointmentIsUpcoming,
  bookingLabel,
  bookingTone,
  formatLusaka,
  formatZmw,
  lusakaLongDay,
  lusakaTime,
  lusakaUntil,
  whatsappHref,
} from "@/lib/utils";
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
  service: { id: string; name: string; durationMin: number };
  customer: { id: string; name: string | null; phone: string };
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

function statusLine(status: string, name: string, asPro: boolean) {
  if (asPro) {
    if (status === "REQUESTED") return `${name} is waiting for you to confirm.`;
    if (status === "ACCEPTED") return "You confirmed this. Start when the visit begins.";
    if (status === "IN_PROGRESS") return "This visit is underway.";
    if (status === "COMPLETED") return "This appointment is done.";
    if (status === "DECLINED") return "You declined this request.";
    if (status === "CANCELLED") return "This booking was cancelled.";
    if (status === "EXPIRED") return "This request expired.";
    return "";
  }
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
  const [viewer, setViewer] = useState<"customer" | "pro" | "admin">("customer");
  const [askCancel, setAskCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const data = await api<{ booking: Booking; viewer: "customer" | "pro" | "admin" }>(`/api/bookings/${id}`);
    setBooking(data.booking);
    setViewer(data.viewer);
  }

  async function setStatus(status: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/bookings/${id}`, { method: "PATCH", json: { status } });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update this booking");
    } finally {
      setBusy(false);
    }
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
        json:
          viewer === "pro"
            ? { customerId: booking.customer.id }
            : { professionalId: booking.professional.id },
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
  const asPro = viewer === "pro";
  const upcoming = appointmentIsUpcoming(booking.status, booking.scheduledAt, booking.service.durationMin);
  const otherName = asPro
    ? booking.customer.name || booking.customer.phone
    : booking.professional.displayName;
  const phone = asPro ? booking.customer.phone : booking.professional.user.phone;
  const until = lusakaUntil(when);

  return (
    <div className="mobile-shell pb-10">
      <div className="space-y-4 px-4 pt-4">
        <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-stone-600">
          Back
        </button>
        <div className="flex items-center gap-3">
          {booking.professional.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.professional.coverUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="font-display text-3xl leading-none text-stone-900">{booking.service.name}</h1>
              <Badge tone={!upcoming && ["REQUESTED", "ACCEPTED"].includes(booking.status) ? "stone" : bookingTone(booking.status)}>
                {!upcoming && booking.status === "REQUESTED"
                  ? "Not confirmed"
                  : !upcoming && booking.status === "ACCEPTED"
                    ? "Missed"
                    : bookingLabel(booking.status)}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-stone-500">{otherName}</p>
          </div>
        </div>

        <Card className="flex items-center gap-4">
          <div className="w-20 shrink-0 text-center">
            <div className="font-display text-3xl leading-none text-stone-900">{lusakaTime(when)}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400">Lusaka</div>
          </div>
          <div className="min-w-0 border-l border-stone-100 pl-4">
            <div className="font-semibold text-stone-900">{lusakaLongDay(when)}</div>
            {until ? <div className="mt-1 text-sm font-semibold text-rose-800">{until}</div> : null}
            <div className="mt-1 text-sm text-stone-500">
              {booking.service.durationMin} min · {atHome ? "They come to you" : "You go to the shop"}
            </div>
            <div className="mt-1 text-sm text-stone-600">{where}</div>
          </div>
        </Card>

        <p className="text-sm text-stone-600">
          {!upcoming && booking.status === "REQUESTED"
            ? asPro
              ? "This time has passed, so there is nothing to confirm."
              : "This time passed before it was confirmed."
            : statusLine(booking.status, otherName, asPro)}
        </p>
        {!upcoming && booking.status === "ACCEPTED" ? (
          <p className="text-sm text-amber-800">This time has passed.</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

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
        <p className="text-sm text-stone-500">
          {asPro
            ? `${booking.customer.name || "They"} pay you ${formatZmw(total)} in cash or mobile money.`
            : `You pay ${booking.professional.displayName} ${formatZmw(total)} in cash or mobile money.`}
        </p>

        <div className="flex flex-col gap-2">
          {asPro && booking.status === "REQUESTED" && upcoming ? (
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={busy} onClick={() => setStatus("ACCEPTED")}>
                Accept
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setStatus("DECLINED")}>
                Decline
              </Button>
            </div>
          ) : null}
          {asPro && booking.status === "ACCEPTED" ? (
            <Button disabled={busy} onClick={() => setStatus("IN_PROGRESS")}>
              Start service
            </Button>
          ) : null}
          {asPro && booking.status === "IN_PROGRESS" ? (
            <Button disabled={busy} onClick={() => setStatus("COMPLETED")}>
              Complete
            </Button>
          ) : null}
          {upcoming && asPro && atHome ? (
            <Link href={`/bookings/${booking.id}/track?as=pro`}>
              <Button className="w-full">Route to them</Button>
            </Link>
          ) : null}
          {upcoming && !asPro ? (
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
                phone,
                asPro
                  ? `Hi ${otherName}, about your ${booking.service.name} on ${formatLusaka(when)}.`
                  : `Hi ${booking.professional.displayName}, about my ${booking.service.name} on ${formatLusaka(when)}.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
          {!asPro ? (
            <Link href={`/pros/${booking.professional.id}`}>
              <Button variant="secondary" className="w-full">
                View {booking.professional.displayName}
              </Button>
            </Link>
          ) : null}
          {!asPro && !upcoming ? (
            <Link href={`/pros/${booking.professional.id}/book?service=${booking.service.id}`}>
              <Button variant="secondary" className="w-full">
                Book again
              </Button>
            </Link>
          ) : null}
          {!asPro && booking.status === "COMPLETED" && !booking.review ? (
            <Link href={`/bookings/${booking.id}/review`}>
              <Button className="w-full">Rate this visit</Button>
            </Link>
          ) : null}
          {!asPro && booking.review ? <p className="text-center text-sm text-stone-500">You already rated this visit.</p> : null}
          {!asPro && upcoming && ["REQUESTED", "ACCEPTED"].includes(booking.status) ? (
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

        {place ? <PlaceMap place={place} /> : null}
      </div>
    </div>
  );
}
