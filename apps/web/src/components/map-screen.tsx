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

function formatAway(km: number) {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}

function inZambia(point: Point) {
  return point.lat > -18.2 && point.lat < -8.1 && point.lng > 21.8 && point.lng < 33.9;
}

function useMyGps(active: boolean) {
  const [gps, setGps] = useState<MapPoint | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [gpsNote, setGpsNote] = useState("");
  const lastFix = useRef<Point | null>(null);
  const lastPost = useRef(0);
  const movedAt = useRef(0);
  const onLive = useRef<((point: MapPoint) => void) | null>(null);
  const stableGps = useRef<MapPoint | null>(null);

  useEffect(() => {
    if (!active || !navigator.geolocation) {
      if (active) setGpsNote("Allow location to see the arrow where you are.");
      return;
    }
    const options = { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 };
    function onFix(pos: GeolocationPosition) {
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
        const next = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        setHeading((current) => (current != null && Math.abs(current - next) < 6 ? current : next));
        movedAt.current = Date.now();
        lastFix.current = point;
      } else if (!prev) {
        lastFix.current = point;
      }
      if (pos.coords.heading != null && pos.coords.heading >= 0) {
        setHeading(pos.coords.heading);
        movedAt.current = Date.now();
      }
      setGps(point);
      setGpsNote("");
      const now = Date.now();
      if (onLive.current && now - lastPost.current > 8000) {
        lastPost.current = now;
        onLive.current({ ...point, heading: pos.coords.heading });
      }
    }
    let attempts = 0;
    function onFail(error: GeolocationPositionError) {
      if (error.code !== 1 && attempts < 3) {
        attempts += 1;
        window.setTimeout(() => navigator.geolocation.getCurrentPosition(onFix, onFail, options), 1200);
        return;
      }
      setGpsNote("Allow location to see the arrow where you are.");
    }
    const id = navigator.geolocation.watchPosition(onFix, onFail, options);

    function onOrient(event: DeviceOrientationEvent) {
      if (Date.now() - movedAt.current < 4000) return;
      const webkit = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      const next = webkit != null ? webkit : event.absolute && event.alpha != null ? (360 - event.alpha) % 360 : null;
      if (next == null) return;
      setHeading((prev) => (prev != null && Math.abs(prev - next) < 8 ? prev : next));
    }
    window.addEventListener("deviceorientationabsolute", onOrient as EventListener, true);
    window.addEventListener("deviceorientation", onOrient, true);
    return () => {
      navigator.geolocation.clearWatch(id);
      window.removeEventListener("deviceorientationabsolute", onOrient as EventListener, true);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, [active]);

  const next = gps ? { ...gps, heading } : null;
  const prev = stableGps.current;
  if (
    !next ||
    !prev ||
    prev.lat !== next.lat ||
    prev.lng !== next.lng ||
    prev.heading !== next.heading ||
    prev.accuracy !== next.accuracy
  ) {
    stableGps.current = next;
  }
  return { gps: stableGps.current, gpsNote, setGpsNote, onLive };
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance !== "function") return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-GB";
    utter.rate = 0.96;
    window.speechSynthesis.speak(utter);
  } catch {
    // A phone without speech still shows the turn on screen.
  }
}

function voiceLine(instruction: string, metres: number) {
  if (instruction.toLowerCase().includes("arrived")) return instruction;
  const bucket = metres > 500 ? 500 : metres > 200 ? 200 : metres > 80 ? 80 : metres > 25 ? 30 : 0;
  if (!bucket) return instruction;
  return `In ${bucket} metres. ${instruction}`;
}

function speakableTime(mins: number) {
  if (mins < 60) return `about ${mins} ${mins === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return rest ? `about ${hourLabel} and ${rest} ${rest === 1 ? "minute" : "minutes"}` : `about ${hourLabel}`;
}

function tripSentence(mode: "driving" | "foot", route: RoutePayload | undefined) {
  const how = mode === "foot" ? "Walking" : "By car";
  if (!route || route.distanceKm == null) return `${how}.`;
  const dist =
    route.distanceKm < 1
      ? `${Math.max(1, Math.round(route.distanceKm * 1000))} metres`
      : `${route.distanceKm < 100 ? route.distanceKm.toFixed(1) : Math.round(route.distanceKm)} kilometres`;
  const time = route.durationMin != null ? `, ${speakableTime(route.durationMin)}` : "";
  return `${how}. ${dist}${time}.`;
}

function turnGlyph(instruction: string) {
  const text = instruction.toLowerCase();
  if (text.includes("arrived")) return "●";
  if (text.includes("roundabout")) return "↻";
  if (text.includes("u-turn") || text.includes("uturn")) return "↩";
  if (text.includes("left")) return "←";
  if (text.includes("right")) return "→";
  return "↑";
}

function askCompass() {
  const orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  orientation.requestPermission?.().catch(() => undefined);
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
  const mine = useMyGps(!open);
  const here = mine.gps ?? (you ? { ...you, heading: null } : null);
  const onMap = here && inZambia(here) ? here : null;
  const away = onMap ? haversineKm(onMap, place) : null;
  if (open) {
    return (
      <MapScreen
        title={place.label}
        place={place}
        placeLabel={place.label}
        onClose={() => setOpen(false)}
      />
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative">
        <ZanaMap
          center={place}
          zoom={16.7}
          height={340}
          spotlight={place}
          you={onMap && (away ?? 99) < 2 ? onMap : null}
          pins={[{ id: "place", lat: place.lat, lng: place.lng, label: place.label }]}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute left-3 top-3 z-10 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow"
        >
          Open map
        </button>
      </div>
      <p className="text-sm text-stone-600">
        {away != null
          ? `${formatAway(away)}. Pinch in for building names. The route stays hidden until you tap Route me.`
          : mine.gpsNote || "Pinch in to read building names. The route stays hidden until you tap Route me."}
      </p>
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
  const tracker = useMyGps(true);
  tracker.onLive.current = onLive ?? null;
  const gps = tracker.gps;
  const gpsNote = tracker.gpsNote;
  const [mode, setMode] = useState<"driving" | "foot">("driving");
  const [routes, setRoutes] = useState<Partial<Record<"driving" | "foot", RoutePayload>>>({});
  const [seeRoute, setSeeRoute] = useState(false);
  const [camera, setCamera] = useState<"place" | "you" | "both" | "follow">(showRoute && followUser ? "follow" : "place");
  const [cameraTick, setCameraTick] = useState(0);
  const [building, setBuilding] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const spoken = useRef("");
  const tripSpoken = useRef("");
  const fitted = useRef(false);

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
  const you = gps && inZambia(gps) ? gps : null;
  const away = you ? haversineKm(you, place) : null;

  useEffect(() => {
    if (showRoute || fitted.current || !you) return;
    if (haversineKm(you, place) < 1.2) {
      fitted.current = true;
      setCamera("both");
      setCameraTick((n) => n + 1);
    }
  }, [you, showRoute, place]);

  function aim(next: "you" | "both" | "follow") {
    askCompass();
    if ((next === "you" || next === "follow") && !you && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => tracker.setGpsNote(""),
        () => tracker.setGpsNote("Allow location to see the arrow where you are."),
        { enableHighAccuracy: true, timeout: 12000 },
      );
    }
    setSeeRoute(false);
    setCamera(next);
    setCameraTick((n) => n + 1);
  }
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
  const spokenLine = current && showRoute ? voiceLine(current.instruction, metresLeft) : "";
  const tripKey = `${mode}|${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;

  useEffect(() => {
    if (!voiceOn || !spokenLine) return;
    const full = tripSpoken.current === tripKey ? spokenLine : `${tripSentence(mode, route)} ${spokenLine}`;
    // A tap on Car or Walk already spoke this turn. Don't cancel it with a second line.
    if (spoken.current === full || (tripSpoken.current === tripKey && spoken.current.endsWith(spokenLine))) return;
    tripSpoken.current = tripKey;
    spoken.current = full;
    speak(full);
  }, [voiceOn, spokenLine, tripKey, mode, route]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);
  const pins = useMemo(
    () => [
      ...(showRoute && routeFrom === "point" && origin
        ? [{ id: "from", lat: origin.lat, lng: origin.lng, label: originLabel, color: "#1c1917" }]
        : []),
      { id: "place", lat: place.lat, lng: place.lng, label: placeLabel, color: "#9f1239" },
    ],
    [showRoute, routeFrom, origin, originLabel, place.lat, place.lng, placeLabel],
  );
  const line = useMemo(() => (showRoute ? route?.coordinates || [] : []), [showRoute, route]);

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[480px] flex-col bg-[#e9e2d6]">
      <div className="absolute inset-0">
        <ZanaMap
          center={place}
          zoom={17}
          height="full"
          you={you}
          spotlight={place}
          onInspect={setBuilding}
          follow={camera === "follow" && !seeRoute}
          camera={camera === "place" ? undefined : camera}
          cameraTick={cameraTick}
          frameRoute={showRoute && seeRoute}
          route={line}
          pins={pins}
        />
      </div>

      <div className="pointer-events-none relative z-10 p-3">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow"
        >
          Back
        </button>
        <div className="pointer-events-auto mt-2 max-w-[220px] rounded-2xl bg-white/95 px-3 py-2 shadow">
          <div className="truncate text-sm font-semibold text-stone-900">{title}</div>
          {building ? <div className="truncate text-xs font-semibold text-rose-800">{building}</div> : null}
          <div className="text-xs text-stone-500">
            {showRoute
              ? `${route?.distanceKm != null ? `${route.distanceKm.toFixed(1)} km` : "…"} · ${formatMins(route?.durationMin ?? null)}`
              : away != null
                ? formatAway(away)
                : gps && !inZambia(gps)
                  ? "Location is outside the Zambia map"
                  : "Where it is"}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 space-y-2 p-3">
        {gpsNote ? (
          <p className="pointer-events-auto rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow">{gpsNote}</p>
        ) : null}
        {showRoute ? (
          <div className="pointer-events-auto grid grid-cols-2 gap-2">
            {(
              [
                ["driving", "Car"],
                ["foot", "Walk"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  const next = routes[key];
                  if (!voiceOn || !next?.steps.length) return;
                  const here = gps || fromPoint;
                  let step = next.steps[0];
                  let nearest = step.distanceM;
                  if (here) {
                    let best = Infinity;
                    for (const candidate of next.steps) {
                      const metres = haversineKm(here, candidate) * 1000;
                      if (metres < best) {
                        best = metres;
                        step = candidate;
                        nearest = metres;
                      }
                    }
                  }
                  const full = `${tripSentence(key, next)} ${voiceLine(step.instruction, nearest)}`;
                  tripSpoken.current = `${key}|${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;
                  spoken.current = full;
                  speak(full);
                }}
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
        ) : (
          <div className="pointer-events-auto grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => aim("you")}
              className="rounded-2xl bg-white px-2 py-2 text-center text-xs font-semibold text-stone-800 shadow"
            >
              My location
            </button>
            <button
              type="button"
              onClick={() => aim("both")}
              disabled={!you}
              className="rounded-2xl bg-white px-2 py-2 text-center text-xs font-semibold text-stone-800 shadow disabled:text-stone-400"
            >
              Me and the place
            </button>
            <button
              type="button"
              onClick={() => aim("follow")}
              className={`rounded-2xl px-2 py-2 text-center text-xs font-semibold shadow ${
                camera === "follow" ? "bg-stone-900 text-white" : "bg-white text-stone-800"
              }`}
            >
              {camera === "follow" ? "Following" : "Follow me"}
            </button>
          </div>
        )}
        {showRoute && current ? (
          <div className="pointer-events-auto flex items-center gap-3 rounded-3xl bg-rose-800 px-4 py-3 text-white shadow">
            <div className="font-display text-3xl leading-none">{turnGlyph(current.instruction)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wide text-rose-100">Next</div>
              <div className="text-base font-semibold">{current.instruction}</div>
              <div className="text-sm text-rose-100">
                {metresLeft < 1000 ? `${metresLeft} m` : `${(metresLeft / 1000).toFixed(1)} km`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (voiceOn) {
                  window.speechSynthesis?.cancel();
                  spoken.current = "";
                  setVoiceOn(false);
                  return;
                }
                setVoiceOn(true);
                if (spokenLine) {
                  const full = `${tripSentence(mode, route)} ${spokenLine}`;
                  tripSpoken.current = tripKey;
                  spoken.current = full;
                  speak(full);
                }
              }}
              className="shrink-0 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold"
            >
              {voiceOn ? "Voice on" : "Hear turn"}
            </button>
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
        onClick={() => {
          speak("Finding the way.");
          setOpen(true);
        }}
        className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-stone-300"
      >
        {label}
      </button>
      {open ? <MapScreen {...props} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
