"use client";

import { Badge } from "@/components/ui";
import { ZanaMap } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import { whatsappHref } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Track = {
  booking: {
    status: string;
    address: string | null;
    service: string;
    locationType: string;
    professional: { name: string; phone: string };
  };
  customer: { lat: number; lng: number };
  pro: { lat: number; lng: number };
  live: boolean;
  distanceKm: number;
  etaMin: number;
  route: [number, number][];
};

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
    const t = setInterval(pull, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id, router]);

  if (!track) return <div className="mobile-shell p-6 text-sm text-stone-500">Finding your pro…</div>;

  return (
    <div className="mobile-shell space-y-4 px-4 py-5">
      <button onClick={() => router.back()} className="text-sm font-semibold text-stone-600">
        Back
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{track.booking.professional.name}</h1>
          <p className="text-sm text-stone-500">{track.booking.service}</p>
        </div>
        <Badge tone={track.live ? "green" : "orange"}>{track.live ? "Live" : "On the way"}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-stone-100">
          <div className="text-xs text-stone-500">Distance</div>
          <div className="mt-1 text-2xl font-semibold">{track.distanceKm.toFixed(1)} km</div>
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-stone-100">
          <div className="text-xs text-stone-500">ETA</div>
          <div className="mt-1 text-2xl font-semibold">{track.etaMin} min</div>
        </div>
      </div>

      <ZanaMap
        center={track.customer}
        height={380}
        pins={[
          {
            id: "you",
            lat: track.customer.lat,
            lng: track.customer.lng,
            label: "You",
            color: "#1c1917",
          },
          {
            id: "pro",
            lat: track.pro.lat,
            lng: track.pro.lng,
            label: track.booking.professional.name.split(" ")[0],
            color: "#ea580c",
          },
        ]}
        route={track.route}
      />
      <p className="text-xs text-stone-500">
        {track.live
          ? "Live pin from the professional’s phone, road route on OpenStreetMap."
          : "Road route from their base. The pin updates when they share live location."}{" "}
        {track.booking.address}
      </p>
      <a
        className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white"
        href={whatsappHref(track.booking.professional.phone, "Hi, I'm tracking you on Zana.")}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp {track.booking.professional.name}
      </a>
    </div>
  );
}
