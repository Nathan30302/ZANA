"use client";

import { ZanaMap } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import type { DirectionStep } from "@/lib/directions";
import { haversineKm } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

type Point = { lat: number; lng: number };

type RoutePayload = {
  coordinates: [number, number][];
  distanceKm: number | null;
  durationMin: number | null;
  steps: DirectionStep[];
};

const LUSAKA = { lat: -15.4167, lng: 28.2833 };

export function RouteGuide({
  from,
  to,
  fromLabel,
  toLabel,
  heading,
  useMyLocation = false,
  onLivePosition,
}: {
  from?: Point | null;
  to: Point | null;
  fromLabel: string;
  toLabel: string;
  heading: string;
  useMyLocation?: boolean;
  onLivePosition?: (point: Point) => void;
}) {
  const [gps, setGps] = useState<Point | null>(null);
  const [gpsNote, setGpsNote] = useState("");
  const [route, setRoute] = useState<RoutePayload | null>(null);
  const lastPost = useRef(0);
  const onLiveRef = useRef(onLivePosition);
  onLiveRef.current = onLivePosition;

  useEffect(() => {
    if (!useMyLocation || !navigator.geolocation) {
      if (useMyLocation) setGpsNote("GPS is not available on this device. Showing Lusaka centre.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps(point);
        setGpsNote("");
        const now = Date.now();
        if (onLiveRef.current && now - lastPost.current > 8000) {
          lastPost.current = now;
          onLiveRef.current(point);
        }
      },
      () => setGpsNote("Allow location to pin where you are. Until then the map uses Lusaka centre."),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [useMyLocation]);

  const origin = useMyLocation ? gps || from || LUSAKA : from;

  useEffect(() => {
    if (!origin || !to) return;
    const handle = setTimeout(() => {
      api<RoutePayload>(
        `/api/geo/route?fromLat=${origin.lat}&fromLng=${origin.lng}&toLat=${to.lat}&toLng=${to.lng}`,
      )
        .then(setRoute)
        .catch(() => setRoute(null));
    }, 350);
    return () => clearTimeout(handle);
  }, [origin?.lat, origin?.lng, to?.lat, to?.lng]);

  const active = useMemo(() => {
    if (!origin || !route?.steps.length) return 0;
    let index = 0;
    let best = Infinity;
    route.steps.forEach((step, i) => {
      const metres = haversineKm(origin, step) * 1000;
      if (metres < best) {
        best = metres;
        index = i;
      }
    });
    return index;
  }, [origin, route]);

  if (!to || !origin) {
    return <p className="text-sm text-stone-500">Waiting for a location…</p>;
  }

  const current = route?.steps[active];
  const metresLeft = current ? Math.round(haversineKm(origin, current) * 1000) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h3 className="font-display text-xl">{heading}</h3>
        <div className="text-right text-sm">
          <div className="font-semibold text-stone-900">
            {route?.distanceKm != null ? `${route.distanceKm.toFixed(1)} km` : "—"}
          </div>
          <div className="text-stone-500">{route?.durationMin != null ? `${route.durationMin} min` : ""}</div>
        </div>
      </div>
      {gpsNote ? <p className="text-xs text-amber-800">{gpsNote}</p> : null}
      {current ? (
        <div className="rounded-3xl bg-rose-800 px-4 py-4 text-white">
          <div className="text-xs uppercase tracking-wide text-rose-100">Next</div>
          <div className="mt-1 text-lg font-semibold">{current.instruction}</div>
          <div className="mt-1 text-sm text-rose-100">
            {metresLeft < 1000 ? `${metresLeft} m` : `${(metresLeft / 1000).toFixed(1)} km`}
          </div>
        </div>
      ) : null}
      <ZanaMap
        center={origin}
        zoom={14}
        height={300}
        route={route?.coordinates || []}
        pins={[
          { id: "from", lat: origin.lat, lng: origin.lng, label: fromLabel, color: "#1c1917" },
          { id: "to", lat: to.lat, lng: to.lng, label: toLabel, color: "#9f1239" },
        ]}
      />
      <ol className="max-h-64 space-y-2 overflow-y-auto rounded-3xl bg-white p-3 ring-1 ring-stone-100">
        {(route?.steps || []).map((step, i) => (
          <li
            key={`${step.lat}-${step.lng}-${i}`}
            className={`rounded-2xl px-3 py-2 text-sm ${i === active ? "bg-rose-50 font-semibold text-rose-900" : "text-stone-600"}`}
          >
            <span className="mr-2 text-xs text-stone-400">{i + 1}</span>
            {step.instruction}
            {step.distanceM > 30 ? (
              <span className="mt-0.5 block text-xs font-normal text-stone-400">
                {step.distanceM < 1000 ? `${step.distanceM} m` : `${(step.distanceM / 1000).toFixed(1)} km`}
              </span>
            ) : null}
          </li>
        ))}
        {!route?.steps.length ? <li className="px-2 py-4 text-sm text-stone-500">Building the road route…</li> : null}
      </ol>
    </div>
  );
}
