"use client";

import { ZanaMap, type MapPoint } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import type { DirectionStep } from "@/lib/directions";
import { haversineKm } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

type Point = { lat: number; lng: number };

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

function formatMb(bytes: number) {
  if (!bytes) return "";
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}

export function ZambiaNote() {
  const [info, setInfo] = useState<{ ready: boolean; bytes: number; download?: boolean } | null>(null);
  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const data = await fetch("/api/geo/zambia").then((r) => r.json());
        if (stop) return;
        setInfo(data);
        if (!data.ready) setTimeout(pull, 4000);
      } catch {
        if (!stop) setTimeout(pull, 4000);
      }
    }
    pull();
    return () => {
      stop = true;
    };
  }, []);
  if (!info?.ready) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
      <span>
        Zambia map is saved{info.bytes ? ` · ${formatMb(info.bytes)}` : ""}. Streets and buildings come from that
        download.
      </span>
      {info.download ? (
        <a className="shrink-0 font-semibold text-rose-800" href="/maps/zambia-map">
          Download
        </a>
      ) : null}
    </div>
  );
}

export function PlaceMap({
  place,
  you,
}: {
  place: { lat: number; lng: number; label: string };
  you?: Point | null;
}) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <MapScreen
        title={place.label}
        place={place}
        placeLabel={place.label}
        followUser
        onClose={() => setOpen(false)}
      />
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative">
        <ZanaMap
          center={place}
          zoom={16}
          height={300}
          you={you}
          pins={[{ id: "place", lat: place.lat, lng: place.lng, label: place.label }]}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-3 left-3 z-10 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow"
        >
          Open map
        </button>
      </div>
      <ZambiaNote />
    </div>
  );
}

export function MapScreen({
  title,
  place,
  placeLabel,
  origin,
  originLabel = "Start",
  followUser = false,
  showRoute = false,
  routeFrom = "gps",
  onClose,
  onLive,
  footer,
}: {
  title: string;
  place: Point;
  placeLabel: string;
  origin?: Point | null;
  originLabel?: string;
  followUser?: boolean;
  showRoute?: boolean;
  routeFrom?: "gps" | "point";
  onClose: () => void;
  onLive?: (point: MapPoint) => void;
  footer?: ReactNode;
}) {
  const [gps, setGps] = useState<MapPoint | null>(null);
  const [gpsNote, setGpsNote] = useState("");
  const [heading, setHeading] = useState<number | null>(null);
  const [mode, setMode] = useState<"driving" | "foot">("driving");
  const [routes, setRoutes] = useState<Partial<Record<"driving" | "foot", RoutePayload>>>({});
  const [seeRoute, setSeeRoute] = useState(false);
  const lastFix = useRef<Point | null>(null);
  const lastPost = useRef(0);
  const onLiveRef = useRef(onLive);
  onLiveRef.current = onLive;

  useEffect(() => {
    if (!followUser || !navigator.geolocation) {
      if (followUser) setGpsNote("Allow location to see the arrow where you are.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        const prev = lastFix.current;
        if (prev && haversineKm(prev, point) * 1000 > 6) {
          const y = Math.sin(((point.lng - prev.lng) * Math.PI) / 180) * Math.cos((point.lat * Math.PI) / 180);
          const x =
            Math.cos((prev.lat * Math.PI) / 180) * Math.sin((point.lat * Math.PI) / 180) -
            Math.sin((prev.lat * Math.PI) / 180) *
              Math.cos((point.lat * Math.PI) / 180) *
              Math.cos(((point.lng - prev.lng) * Math.PI) / 180);
          setHeading(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
          lastFix.current = point;
        } else if (!prev) {
          lastFix.current = point;
        }
        if (pos.coords.heading != null && pos.coords.heading >= 0) setHeading(pos.coords.heading);
        setGps(point);
        setGpsNote("");
        const now = Date.now();
        if (onLiveRef.current && now - lastPost.current > 8000) {
          lastPost.current = now;
          onLiveRef.current(point);
        }
      },
      () => setGpsNote("Allow location to see the arrow where you are."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [followUser]);

  const fromPoint = showRoute ? (routeFrom === "gps" ? gps : origin) : null;
  const fromKey = fromPoint ? `${fromPoint.lat.toFixed(3)},${fromPoint.lng.toFixed(3)}` : "";

  useEffect(() => {
    if (!showRoute || !fromPoint) return;
    const handle = setTimeout(() => {
      Promise.all(
        (["driving", "foot"] as const).map(async (profile) => {
          const data = await api<RoutePayload>(
            `/api/geo/route?fromLat=${fromPoint.lat}&fromLng=${fromPoint.lng}&toLat=${place.lat}&toLng=${place.lng}&profile=${profile}`,
          );
          return [profile, data] as const;
        }),
      )
        .then((pairs) => setRoutes(Object.fromEntries(pairs)))
        .catch(() => setRoutes({}));
    }, 300);
    return () => clearTimeout(handle);
    // fromKey rounds the GPS so the route is not rebuilt on every tiny step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRoute, fromKey, place.lat, place.lng]);

  const route = routes[mode];
  const you: MapPoint | null = gps ? { ...gps, heading } : null;
  const active = useMemo(() => {
    const here = gps || fromPoint;
    if (!here || !route?.steps.length) return 0;
    let index = 0;
    let best = Infinity;
    route.steps.forEach((step, i) => {
      const metres = haversineKm(here, step) * 1000;
      if (metres < best) {
        best = metres;
        index = i;
      }
    });
    return index;
  }, [gps, fromPoint, route]);

  const current = route?.steps[active];
  const metresLeft = current && (gps || fromPoint) ? Math.round(haversineKm(gps || fromPoint!, current) * 1000) : 0;
  const pins = [
    ...(showRoute && routeFrom === "point" && origin
      ? [{ id: "from", lat: origin.lat, lng: origin.lng, label: originLabel, color: "#1c1917" }]
      : []),
    { id: "place", lat: place.lat, lng: place.lng, label: placeLabel, color: "#9f1239" },
  ];

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[480px] flex-col bg-[#efeae2]">
      <div className="absolute inset-0">
        <ZanaMap
          center={followUser && gps ? gps : place}
          zoom={16}
          height="full"
          you={you}
          follow={followUser && !seeRoute}
          frameRoute={showRoute && seeRoute}
          route={showRoute ? route?.coordinates || [] : []}
          pins={pins}
        />
      </div>

      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-2 p-3">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow"
        >
          Back
        </button>
        <div className="pointer-events-auto max-w-[240px] rounded-2xl bg-white/95 px-3 py-2 text-right shadow">
          <div className="truncate text-sm font-semibold text-stone-900">{title}</div>
          <div className="text-xs text-stone-500">
            {showRoute
              ? `${route?.distanceKm != null ? `${route.distanceKm.toFixed(1)} km` : "…"} · ${formatMins(route?.durationMin ?? null)}`
              : "Where it is"}
          </div>
        </div>
      </div>

      {showRoute ? (
        <div className="pointer-events-auto absolute left-3 right-16 top-16 z-10 grid grid-cols-2 gap-2">
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
              className={`rounded-2xl px-3 py-2 text-left text-sm shadow ${
                mode === key ? "bg-rose-800 text-white" : "bg-white text-stone-700"
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
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-2 p-3">
        {gpsNote ? (
          <p className="pointer-events-auto rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow">{gpsNote}</p>
        ) : null}
        {showRoute && current ? (
          <div className="pointer-events-auto rounded-3xl bg-rose-800 px-4 py-3 text-white shadow">
            <div className="text-[11px] uppercase tracking-wide text-rose-100">Next</div>
            <div className="text-base font-semibold">{current.instruction}</div>
            <div className="text-sm text-rose-100">
              {metresLeft < 1000 ? `${metresLeft} m` : `${(metresLeft / 1000).toFixed(1)} km`}
            </div>
          </div>
        ) : null}
        {showRoute ? (
          <button
            type="button"
            onClick={() => setSeeRoute((v) => !v)}
            className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow"
          >
            {seeRoute ? "Follow me" : "Whole route"}
          </button>
        ) : null}
        {footer ? <div className="pointer-events-auto">{footer}</div> : null}
      </div>
    </div>
  );
}

export function RouteButton({
  label = "Route me",
  disabled,
  ...props
}: Omit<ComponentProps<typeof MapScreen>, "onClose"> & { label?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-stone-300"
      >
        {label}
      </button>
      {open ? <MapScreen {...props} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
