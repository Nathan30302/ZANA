"use client";

import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  locationType: string;
  address: string | null;
  servicePriceZmw: number;
  travelFeeZmw: number;
  customerNote: string | null;
  service: { name: string; durationMin: number };
  professional: { id: string; displayName: string; coverUrl: string | null };
  review: { id: string } | null;
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);

  async function load() {
    const data = await api<{ booking: Booking }>(`/api/bookings/${id}`);
    setBooking(data.booking);
  }

  useEffect(() => {
    load().catch(() => router.push("/login"));
  }, [id, router]);

  async function cancel() {
    await api(`/api/bookings/${id}`, { method: "PATCH", json: { status: "CANCELLED" } });
    await load();
  }

  if (!booking) return <div className="mobile-shell p-6 text-sm text-stone-500">Loading…</div>;

  return (
    <div className="mobile-shell space-y-4 px-4 py-6">
      <button onClick={() => router.back()} className="text-sm font-semibold text-stone-600">
        Back
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{booking.service.name}</h1>
          <p className="text-stone-500">{booking.professional.displayName}</p>
        </div>
        <Badge>{booking.status}</Badge>
      </div>

      <Card className="space-y-2 text-sm">
        <div>{format(new Date(booking.scheduledAt), "EEEE d MMMM · HH:mm")}</div>
        <div>
          {booking.locationType === "AT_HOME" ? "At Home" : "At Shop"} · {booking.address}
        </div>
        <div className="font-semibold">
          {formatZmw(booking.servicePriceZmw + booking.travelFeeZmw)}
        </div>
        {booking.customerNote ? <div className="text-stone-500">Note: {booking.customerNote}</div> : null}
      </Card>

      <div className="flex flex-col gap-2">
        <Link href={`/pros/${booking.professional.id}`}>
          <Button variant="secondary" className="w-full">
            View professional
          </Button>
        </Link>
        {booking.status === "COMPLETED" && !booking.review ? (
          <Link href={`/bookings/${booking.id}/review`}>
            <Button className="w-full">Leave a review</Button>
          </Link>
        ) : null}
        {["REQUESTED", "ACCEPTED"].includes(booking.status) ? (
          <Button variant="danger" onClick={cancel}>
            Cancel booking
          </Button>
        ) : null}
      </div>
    </div>
  );
}
