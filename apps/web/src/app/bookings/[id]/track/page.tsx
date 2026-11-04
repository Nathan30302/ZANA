"use client";

import { RouteGuide } from "@/components/route-guide";
import { Badge } from "@/components/ui";
import { api } from "@/lib/api-client";
import { whatsappHref } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Track = {
  mode: "TO_SHOP" | "TO_YOU";
  booking: {
    status: string;
    address: string | null;
    service: string;
    professional: { name: string; phone: string; address: string | null };
  };
  customer: { lat: number; lng: number };
  pro: { lat: number; lng: number };
  shop: { lat: number; lng: number; address: string | null };
  live: boolean;
  distanceKm: number;
  etaMin: number;
};

function TrackInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const asPro = useSearchParams().get("as") === "pro";
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const data = await api<Track>(`/api/bookings/${id}/track`);
        if (!stop) setTrack(data);
      } catch {
        router.replace("/login");
      }
    }
    pull();
    const t = setInterval(pull, 5000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id, router]);

  if (!track) return <div className="p-6 text-sm text-stone-500">Loading the route…</div>;

  const toShop = track.mode === "TO_SHOP";
  const heading = toShop
    ? `Route to ${track.booking.professional.name}`
    : asPro
      ? "Route to the customer"
      : "Coming to you";

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm font-semibold text-stone-600">
        Back
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{heading}</h1>
          <p className="text-sm text-stone-500">
            {track.booking.service}
            {track.booking.address ? ` · ${track.booking.address}` : ""}
          </p>
        </div>
        <Badge tone={track.live ? "green" : "orange"}>
          {toShop ? "To the shop" : track.live ? "Live" : `${track.etaMin} min`}
        </Badge>
      </div>

      {toShop ? (
        <RouteGuide
          to={{ lat: track.shop.lat, lng: track.shop.lng }}
          fromLabel="You"
          toLabel="Shop"
          heading="Directions"
          useMyLocation
        />
      ) : asPro ? (
        <RouteGuide
          to={track.customer}
          fromLabel="You"
          toLabel="Customer"
          heading="Directions"
          useMyLocation
          onLivePosition={(point) => {
            api("/api/pro/location", { method: "POST", json: point }).catch(() => undefined);
          }}
        />
      ) : (
        <RouteGuide
          from={track.pro}
          to={track.customer}
          fromLabel={track.booking.professional.name.split(" ")[0]}
          toLabel="You"
          heading={track.live ? "Live route" : "Route from their place"}
        />
      )}

      <p className="text-xs text-stone-500">
        {toShop
          ? "Follow the turns to the salon. Your blue-black pin is your GPS."
          : asPro
            ? "Your GPS is the start. The customer pin is where you are going. Distance updates as you move."
            : track.live
              ? "The professional is sharing GPS. Distance and turns update as they get closer."
              : "This is the drive from their shop to your pin. It switches to live when they start the trip."}
      </p>
      {!asPro ? (
        <a
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white"
          href={whatsappHref(track.booking.professional.phone, `Hi, I'm looking at the route on Zana.`)}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp {track.booking.professional.name}
        </a>
      ) : null}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="mobile-shell px-4 py-5">
      <Suspense fallback={<div className="text-sm text-stone-500">Loading the route…</div>}>
        <TrackInner />
      </Suspense>
    </div>
  );
}
