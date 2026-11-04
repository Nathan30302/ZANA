"use client";

import { ZanaMap } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import type { DirectionStep } from "@/lib/directions";
import { haversineKm } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

type Point = { lat: number; lng: number; accuracy?: number };

type RoutePayload = {
  coordinates: [number, number][];
  distanceKm: number | null;
  durationMin: number | null;
  steps: DirectionStep[];
};

function formatMins(mins: number | null) {
  if (mins == null) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

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
  const [mode, setMode] = useState<"driving" | "foot">("driving");
  const [routes, setRoutes] = useState<Partial<Record<"driving" | "foot", RoutePayload>>>({});
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
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
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
      Promise.all(
        (["driving", "foot"] as const).map(async (profile) => {
          const data = await api<RoutePayload>(
            `/api/geo/route?fromLat=${origin.lat}&fromLng=${origin.lng}&toLat=${to.lat}&toLng=${to.lng}&profile=${profile}`,
          );
          return [profile, data] as const;
        }),
      )
        .then((pairs) => setRoutes(Object.fromEntries(pairs)))
        .catch(() => setRoutes({}));
    }, 350);
    return () => clearTimeout(handle);
  }, [origin?.lat, origin?.lng, to?.lat, to?.lng]);

  const route = routes[mode];

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
        <div className="text-right text-sm font-semibold text-stone-900">Route to</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["driving", "Car"],
            ["foot", "Walk"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`rounded-2xl px-3 py-2 text-left text-sm ${
              mode === key ? "bg-rose-800 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"
            }`}
          >
            <div className="font-semibold">{label}</div>
            <div className={mode === key ? "text-rose-100" : "text-stone-500"}>
              {routes[key]?.distanceKm != null ? `${routes[key]!.distanceKm!.toFixed(1)} km` : "…"} ·{" "}
              {formatMins(routes[key]?.durationMin ?? null)}
            </div>
          </button>
        ))}
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
        zoom={16}
        height={340}
        you={useMyLocation ? origin : toLabel === "You" ? to : null}
        route={route?.coordinates || []}
        pins={[
          ...(useMyLocation
            ? []
            : [{ id: "from", lat: origin.lat, lng: origin.lng, label: fromLabel, color: "#1c1917" }]),
          { id: "to", lat: to.lat, lng: to.lng, label: toLabel, color: "#9f1239" },
        ]}
      />
      <p className="text-[11px] text-stone-400">
        Building shapes are from OpenStreetMap, the same map data Maps.me uses. The blue dot is your GPS.
      </p>
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
