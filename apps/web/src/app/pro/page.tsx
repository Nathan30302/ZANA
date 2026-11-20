"use client";

import { Badge, BrandWordmark, Button, Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { bookingLabel, bookingTone, formatZmw, lusakaDateKey, lusakaDay, lusakaTime, lusakaUntil, lusakaWhen } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Pro = {
  id: string;
  displayName: string;
  status: string;
  verified: boolean;
  floatBalanceZmw: number;
  lat: number | null;
  lng: number | null;
};

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
  service: { name: string };
  customer: { id: string; name: string | null; phone: string };
};

export default function ProHomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [pro, setPro] = useState<Pro | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tripNote, setTripNote] = useState("");
  const sim = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<{
          user: { name: string | null; role: string; professional: Pro | null } | null;
        }>("/api/auth/me");
        if (!me.user) {
          router.replace("/pro/login");
          return;
        }
        setUserName(me.user.name || "Pro");
        if (!me.user.professional) {
          router.replace("/pro/apply");
          return;
        }
        setPro(me.user.professional);
        if (me.user.professional.status === "PENDING") {
          // still show dashboard with pending banner
        }
        const b = await api<{ bookings: Booking[] }>("/api/bookings?scope=pro");
        setBookings(b.bookings);
      } catch {
        router.replace("/pro/login");
      }
    })();
  }, [router]);

  const todayKey = lusakaDateKey();
  const today = useMemo(() => {
    return bookings
      .filter((b) => lusakaDateKey(new Date(b.scheduledAt)) === todayKey)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [bookings, todayKey]);
  const needsReply = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "REQUESTED")
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [bookings],
  );
  const later = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            ["ACCEPTED", "IN_PROGRESS"].includes(b.status) &&
            lusakaDateKey(new Date(b.scheduledAt)) > todayKey,
        )
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [bookings, todayKey],
  );
  const toCollect = today
    .filter((b) => ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(b.status))
    .reduce((sum, b) => sum + b.servicePriceZmw + b.travelFeeZmw, 0);

  async function messageCustomer(customerId: string) {
    const data = await api<{ conversation: { id: string } }>("/api/conversations", {
      method: "POST",
      json: { customerId },
    });
    router.push(`/messages/${data.conversation.id}`);
  }

  async function shareGps() {
    if (!navigator.geolocation) {
      setTripNote("This browser has no GPS. Use the demo trip instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await api("/api/pro/location", {
        method: "POST",
        json: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      });
      setTripNote("Live location shared.");
    });
  }

  async function simulateTrip(b: Booking) {
    if (pro?.lat == null || pro.lng == null || b.customerLat == null || b.customerLng == null) {
      setTripNote("Need a home pin on the booking before a live trip.");
      return;
    }
    const token = ++sim.current;
    setTripNote("Driving toward the customer…");
    const route = await api<{ coordinates: [number, number][] }>(
      `/api/geo/route?fromLat=${pro.lat}&fromLng=${pro.lng}&toLat=${b.customerLat}&toLng=${b.customerLng}`,
    );
    const points = route.coordinates.filter((_, i) => i % 6 === 0);
    for (const [lat, lng] of points) {
      if (sim.current !== token) return;
      await api("/api/pro/location", { method: "POST", json: { lat, lng } });
      await new Promise((r) => setTimeout(r, 2500));
    }
    if (sim.current === token) setTripNote("Arrived near the customer.");
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/api/bookings/${id}`, { method: "PATCH", json: { status } });
      setTripNote("");
    } catch (e) {
      setTripNote(e instanceof Error ? e.message : "Could not update this booking");
    }
    const b = await api<{ bookings: Booking[] }>("/api/bookings?scope=pro");
    setBookings(b.bookings);
  }

  if (!pro) {
    return <div className="p-6 text-sm text-stone-500">Loading pro dashboard…</div>;
  }

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <BrandWordmark mark={40} />
          <p className="mt-2 text-sm text-stone-500">
            {userName} · {lusakaDay(new Date())}
          </p>
        </div>
        <Link href="/messages" className="text-sm font-semibold text-rose-800">
          Messages
        </Link>
      </div>

      {tripNote ? <p className="text-sm font-medium text-rose-800">{tripNote}</p> : null}

      {pro.status !== "APPROVED" ? (
        <Card className="bg-amber-50 ring-amber-100">
          <div className="font-semibold text-amber-900">Application {pro.status.toLowerCase()}</div>
          <p className="mt-1 text-sm text-amber-800">
            {pro.status === "PENDING"
              ? "Admins usually review within 24–48 hours. You can’t receive public bookings yet."
              : "Update your application or contact support."}
          </p>
          <Link href="/pro/apply" className="mt-3 inline-block text-sm font-semibold text-rose-800">
            View application →
          </Link>
        </Card>
      ) : (
        <div className="flex items-center gap-2">
          {pro.verified ? <Badge tone="green">Verified</Badge> : null}
          <Badge>Live on Zana</Badge>
        </div>
      )}

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[28px] bg-stone-950 text-white">
        <div className="bg-stone-950 px-3 py-4">
          <div className="text-[11px] text-white/55">Today</div>
          <div className="mt-1 font-display text-2xl">{today.length}</div>
        </div>
        <div className="bg-stone-950 px-3 py-4">
          <div className="text-[11px] text-white/55">To collect</div>
          <div className="mt-1 font-display text-2xl">{formatZmw(toCollect)}</div>
        </div>
        <div className="bg-stone-950 px-3 py-4">
          <div className="text-[11px] text-white/55">Float</div>
          <div className="mt-1 font-display text-2xl">{formatZmw(pro.floatBalanceZmw)}</div>
        </div>
      </div>

      {needsReply.length ? (
        <div>
          <SectionTitle title="Needs a reply" />
          <div className="space-y-3">
            {needsReply.map((b) => (
              <Card key={b.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 shrink-0 text-center">
                    <div className="font-display text-lg leading-none text-stone-900">
                      {lusakaTime(new Date(b.scheduledAt))}
                    </div>
                    <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
                      {lusakaWhen(new Date(b.scheduledAt))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{b.service.name}</div>
                        <div className="truncate text-sm text-stone-500">{b.customer.name || b.customer.phone}</div>
                        <div className="text-xs text-stone-500">
                          {b.locationType === "AT_HOME" ? "You go to them" : "They come to the shop"}
                          {" · "}
                          {formatZmw(b.servicePriceZmw + b.travelFeeZmw)}
                        </div>
                        {lusakaUntil(new Date(b.scheduledAt)) ? (
                          <div className="text-xs font-semibold text-rose-800">
                            {lusakaUntil(new Date(b.scheduledAt))}
                          </div>
                        ) : null}
                      </div>
                      <Badge tone="orange">Waiting</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => updateStatus(b.id, "ACCEPTED")}>Accept</Button>
                  <Button variant="secondary" onClick={() => updateStatus(b.id, "DECLINED")}>
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <SectionTitle title="Today" />
        {today.filter((b) => b.status !== "REQUESTED").length === 0 ? (
          <Card className="text-sm text-stone-500">
            {needsReply.some((b) => lusakaDateKey(new Date(b.scheduledAt)) === todayKey)
              ? "Today’s request is waiting for your reply above."
              : "Nothing booked today."}
          </Card>
        ) : (
          <div className="space-y-3">
            {today
              .filter((b) => b.status !== "REQUESTED")
              .map((b) => (
                <Card key={b.id} className="space-y-3">
                  <Link href={`/bookings/${b.id}`} className="flex items-start gap-3">
                    <div className="w-16 shrink-0 text-center">
                      <div className="font-display text-lg leading-none text-stone-900">
                        {lusakaTime(new Date(b.scheduledAt))}
                      </div>
                      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">Today</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{b.service.name}</div>
                          <div className="truncate text-sm text-stone-500">{b.customer.name || b.customer.phone}</div>
                          <div className="text-xs text-stone-500">
                            {b.locationType === "AT_HOME" ? b.address || "You go to them" : "They come to the shop"}
                          </div>
                        </div>
                        <Badge tone={bookingTone(b.status)}>{bookingLabel(b.status)}</Badge>
                      </div>
                    </div>
                  </Link>
                  {b.locationType === "AT_HOME" && ["ACCEPTED", "IN_PROGRESS"].includes(b.status) ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/bookings/${b.id}/track?as=pro`}
                          className="inline-flex items-center justify-center rounded-2xl bg-rose-800 px-3 py-3 text-sm font-semibold text-white"
                        >
                          Route to them
                        </Link>
                        <Button variant="secondary" onClick={shareGps}>
                          Share GPS
                        </Button>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-semibold text-stone-500"
                        onClick={() => simulateTrip(b)}
                      >
                        Simulate the drive
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="text-sm font-semibold text-rose-800"
                    onClick={() => messageCustomer(b.customer.id)}
                  >
                    Message {b.customer.name || "customer"}
                  </button>
                  {b.status === "ACCEPTED" ? (
                    <Button className="w-full" onClick={() => updateStatus(b.id, "IN_PROGRESS")}>
                      Start service
                    </Button>
                  ) : null}
                  {b.status === "IN_PROGRESS" ? (
                    <Button className="w-full" onClick={() => updateStatus(b.id, "COMPLETED")}>
                      Complete
                    </Button>
                  ) : null}
                </Card>
              ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle title="Later" />
        {later.length === 0 ? (
          <Card className="text-sm text-stone-500">No confirmed visits after today.</Card>
        ) : (
          <div className="space-y-2">
            {later.slice(0, 5).map((b) => (
              <Card key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{b.service.name}</div>
                  <div className="text-stone-500">
                    {lusakaWhen(new Date(b.scheduledAt))} · {lusakaTime(new Date(b.scheduledAt))} ·{" "}
                    {b.customer.name || "Customer"}
                  </div>
                </div>
                <Badge tone={bookingTone(b.status)}>{bookingLabel(b.status)}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
