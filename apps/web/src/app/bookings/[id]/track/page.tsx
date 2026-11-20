"use client";

import { MapScreen } from "@/components/map-screen";
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

  if (!track) {
    return <div className="mobile-shell p-6 text-sm text-stone-500">Opening the map…</div>;
  }

  const toShop = track.mode === "TO_SHOP";
  const title = toShop
    ? track.booking.professional.name
    : asPro
      ? "Customer"
      : track.booking.professional.name;

  if (toShop) {
    return (
      <MapScreen
        title={title}
        place={track.shop}
        placeLabel="Shop"
        followUser
        showRoute
        routeFrom="gps"
        onClose={() => router.back()}
        footer={
          <a
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white"
            href={whatsappHref(track.booking.professional.phone, "Hi, I'm on the way.")}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp {track.booking.professional.name}
          </a>
        }
      />
    );
  }

  if (asPro) {
    return (
      <MapScreen
        title={title}
        place={track.customer}
        placeLabel="Customer"
        followUser
        showRoute
        routeFrom="gps"
        onClose={() => router.back()}
        onLive={(point) => {
          api("/api/pro/location", { method: "POST", json: point }).catch(() => undefined);
        }}
      />
    );
  }

  return (
    <MapScreen
      title={title}
      place={track.customer}
      placeLabel="You"
      origin={track.pro}
      originLabel={track.booking.professional.name.split(" ")[0]}
      showRoute
      routeFrom="point"
      onClose={() => router.back()}
      footer={
        <a
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white"
          href={whatsappHref(track.booking.professional.phone, "Hi, I'm looking at the map on Zana.")}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp {track.booking.professional.name}
        </a>
      }
    />
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="mobile-shell p-6 text-sm text-stone-500">Opening the map…</div>}>
      <TrackInner />
    </Suspense>
  );
}
