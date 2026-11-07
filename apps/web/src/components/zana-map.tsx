"use client";

import { watchCompass } from "@/lib/live-fix";
import { zambiaStyle } from "@/lib/zambia-style";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  href?: string;
};

export type MapPoint = { lat: number; lng: number; accuracy?: number; heading?: number | null };

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  pins?: MapPin[];
  route?: [number, number][];
  height?: number | "full";
  pick?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  you?: MapPoint | null;
  /** Keep the arrow centred and turn the map as they move. */
  follow?: boolean;
  /** Fit the route in view once. */
  frameRoute?: boolean;
  /** One-shot camera move. `follow` keeps tracking after that. */
  camera?: "you" | "both" | "follow";
  cameraTick?: number;
  /** Outline the building under this point once the tiles are drawn. */
  spotlight?: { lat: number; lng: number } | null;
  /** Fired when someone taps a named building. */
  onInspect?: (name: string | null) => void;
  /** Fit every pin (and you) once. Bump the number to fit again. */
  fitTick?: number;
  /** Zoom to street level on you, so building footprints fill the screen. */
  streetTick?: number;
};

function ringPolygon(lat: number, lng: number, radiusM: number) {
  const earth = 6378137;
  const coords: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const bearing = (i / 64) * Math.PI * 2;
    const dx = radiusM * Math.cos(bearing);
    const dy = radiusM * Math.sin(bearing);
    const lat2 = lat + (dy / earth) * (180 / Math.PI);
    const lng2 = lng + ((dx / earth) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);
    coords.push([lng2, lat2]);
  }
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

function metresAhead(lat: number, lng: number, heading: number, metres: number): [number, number] {
  const rad = (heading * Math.PI) / 180;
  const north = metres * Math.cos(rad);
  const east = metres * Math.sin(rad);
  const dLat = north / 111320;
  const dLng = east / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

function movedMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earth = 6371000;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function ZanaMap({
  center,
  zoom = 16,
  pins = [],
  route = [],
  height = 300,
  pick,
  onPick,
  you,
  follow = false,
  frameRoute = false,
  camera,
  cameraTick = 0,
  spotlight,
  onInspect,
  fitTick = 0,
  streetTick = 0,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markers = useRef<import("maplibre-gl").Marker[]>([]);
  const pickMarker = useRef<import("maplibre-gl").Marker | null>(null);
  const youMarker = useRef<import("maplibre-gl").Marker | null>(null);
  const onPickRef = useRef(onPick);
  const followRef = useRef(follow);
  const youRef = useRef(you);
  const pinsRef = useRef(pins);
  youRef.current = you;
  pinsRef.current = pins;
  const paused = useRef(false);
  const fitted = useRef("");
  const lastCam = useRef<{ lat: number; lng: number; heading: number } | null>(null);
  const targetRef = useRef<{ lat: number; lng: number; heading: number | null; accuracy?: number } | null>(null);
  const shownRef = useRef<{ lat: number; lng: number; heading: number } | null>(null);
  const compassLive = useRef(false);
  const [ready, setReady] = useState(false);
  const [mapReady, setMapReady] = useState<boolean | null>(null);
  const [pausedUi, setPausedUi] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const onInspectRef = useRef(onInspect);
  const spotlightRef = useRef(spotlight);
  onPickRef.current = onPick;
  followRef.current = follow;
  onInspectRef.current = onInspect;
  spotlightRef.current = spotlight;

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const data = await fetch("/api/geo/zambia").then((r) => r.json());
        if (stop) return;
        setMapReady(Boolean(data.ready));
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

  useEffect(() => {
    if (!mapReady) return;
    let dead = false;
    let map: import("maplibre-gl").Map | null = null;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (dead || !el.current || mapRef.current) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      map = new maplibregl.Map({
        container: el.current,
        style: zambiaStyle() as import("maplibre-gl").StyleSpecification,
        center: [center.lng, center.lat],
        zoom,
        pitch: 0,
        maxPitch: 0,
        bearing: 0,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }), "top-right");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 72, unit: "metric" }), "top-right");
      map.on("dragstart", () => {
        if (!followRef.current) return;
        paused.current = true;
        setPausedUi(true);
      });
      map.on("load", () => {
        if (!map) return;
        map.resize();
        map.addSource("focus-building", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "focus-building-fill",
          type: "fill",
          source: "focus-building",
          paint: { "fill-color": "#9f1239", "fill-opacity": 0.28 },
        });
        map.addLayer({
          id: "focus-building-line",
          type: "line",
          source: "focus-building",
          paint: { "line-color": "#9f1239", "line-width": 3 },
        });
        map.addSource("inspected-building", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "inspected-building-fill",
          type: "fill",
          source: "inspected-building",
          paint: { "fill-color": "#1c1917", "fill-opacity": 0.22 },
        });
        map.addLayer({
          id: "inspected-building-line",
          type: "line",
          source: "inspected-building",
          paint: { "line-color": "#1c1917", "line-width": 2.5 },
        });
        map.on("click", (event) => {
          if (onPickRef.current || !map) return;
          const hits = map.queryRenderedFeatures(event.point, { layers: ["building"] });
          const named = hits.find((feature) => feature.properties?.name);
          const hit = named || hits[0];
          const src = map.getSource("inspected-building") as import("maplibre-gl").GeoJSONSource | undefined;
          const geometry = hit?.geometry;
          if (!src || !geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) {
            src?.setData({ type: "FeatureCollection", features: [] });
            setInspected(null);
            onInspectRef.current?.(null);
            return;
          }
          src.setData({ type: "Feature", geometry, properties: {} });
          const name = hit.properties?.name ? String(hit.properties.name) : "Building";
          setInspected(name);
          onInspectRef.current?.(name);
        });
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addLayer({
          id: "route-case",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#ffffff", "line-width": 8 },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#9f1239", "line-width": 5 },
        });
        map.addLayer({
          id: "route-arrows",
          type: "symbol",
          source: "route",
          layout: {
            "symbol-placement": "line",
            "symbol-spacing": 70,
            "text-field": "▸",
            "text-font": ["Noto Sans Bold"],
            "text-size": 16,
            "text-rotation-alignment": "map",
            "text-keep-upright": false,
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#ffffff", "text-halo-color": "#9f1239", "text-halo-width": 1 },
        });
        map.addSource("you-ring", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "you-ring-fill",
          type: "fill",
          source: "you-ring",
          paint: { "fill-color": "#2563eb", "fill-opacity": 0.16 },
        });
        mapRef.current = map;
        setReady(true);
      });
    })();
    const node = el.current;
    const observer = node ? new ResizeObserver(() => mapRef.current?.resize()) : null;
    if (node) observer?.observe(node);
    return () => {
      dead = true;
      observer?.disconnect();
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      pickMarker.current?.remove();
      pickMarker.current = null;
      youMarker.current?.remove();
      youMarker.current = null;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // The camera is owned after creation so a new center does not rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled) return;
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      pins.forEach((p) => {
        const wrap = document.createElement("button");
        wrap.type = "button";
        wrap.className = "zana-pin";
        const label = document.createElement("span");
        label.textContent = p.label;
        label.style.background = p.color || "#9f1239";
        const tip = document.createElement("i");
        tip.style.background = p.color || "#9f1239";
        wrap.append(label, tip);
        const marker = new maplibregl.Marker({ element: wrap, anchor: "bottom" })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        if (p.href) wrap.onclick = () => { window.location.href = p.href!; };
        markers.current.push(marker);
      });
      const source = map.getSource("route") as import("maplibre-gl").GeoJSONSource | undefined;
      source?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: route.map(([lat, lng]) => [lng, lat]),
        },
      });
      const end = route[route.length - 1];
      const fitKey = end ? `${end[0].toFixed(3)},${end[1].toFixed(3)}` : "";
      if (frameRoute && route.length > 1 && fitKey && fitKey !== fitted.current) {
        fitted.current = fitKey;
        const lngs = route.map((p) => p[1]);
        const lats = route.map((p) => p[0]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 56, maxZoom: 16, duration: 600 },
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pins, route, ready, frameRoute, follow]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !onPick) return;
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !pick) return;
      if (!pickMarker.current) {
        const node = document.createElement("div");
        node.className = "zana-pick";
        node.append(document.createElement("i"));
        const marker = new maplibregl.Marker({ element: node, anchor: "bottom", draggable: true })
          .setLngLat([pick.lng, pick.lat])
          .addTo(map);
        marker.on("dragend", () => {
          const ll = marker.getLngLat();
          onPickRef.current?.(ll.lat, ll.lng);
        });
        map.on("click", (event) => {
          if (!onPickRef.current) return;
          marker.setLngLat(event.lngLat);
          onPickRef.current(event.lngLat.lat, event.lngLat.lng);
        });
        pickMarker.current = marker;
      } else {
        const current = pickMarker.current.getLngLat();
        if (Math.abs(current.lat - pick.lat) > 0.00015 || Math.abs(current.lng - pick.lng) > 0.00015) {
          pickMarker.current.setLngLat([pick.lng, pick.lat]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pick, ready, onPick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const ring = map.getSource("you-ring") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!you) {
      ring?.setData({ type: "FeatureCollection", features: [] });
      youMarker.current?.remove();
      youMarker.current = null;
      targetRef.current = null;
      shownRef.current = null;
      return;
    }
    const previous = targetRef.current;
    targetRef.current = {
      lat: you.lat,
      lng: you.lng,
      heading: compassLive.current ? (previous?.heading ?? you.heading ?? null) : (you.heading ?? previous?.heading ?? null),
      accuracy: you.accuracy,
    };
    if (youMarker.current) return;
    let cancelled = false;
    const here = you;
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || youMarker.current) return;
      const node = document.createElement("div");
      node.className = "zana-arrow";
      node.title = "You are here";
      node.innerHTML =
        '<div class="zana-arrow-face"><svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true"><path d="M42 42 L26 8 L58 8 Z" fill="rgba(29,78,216,0.28)"/><circle cx="42" cy="42" r="15" fill="#fff"/><path d="M42 18 L56 54 L42 46 L28 54 Z" fill="#1d4ed8" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></div>';
      youMarker.current = new maplibregl.Marker({ element: node, anchor: "center", rotationAlignment: "map" })
        .setLngLat([here.lng, here.lat])
        .addTo(map);
      shownRef.current = { lat: here.lat, lng: here.lng, heading: here.heading ?? 0 };
    });
    return () => {
      cancelled = true;
    };
  }, [you, ready]);

  useEffect(() => {
    if (!ready) return;
    return watchCompass((degrees) => {
      compassLive.current = true;
      const target = targetRef.current;
      if (!target) return;
      target.heading = degrees;
    });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    let last = performance.now();
    let ringAt = { lat: 0, lng: 0 };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const map = mapRef.current;
      const marker = youMarker.current;
      const target = targetRef.current;
      if (!map || !marker || !target) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let shown = shownRef.current;
      if (!shown) {
        shown = { lat: target.lat, lng: target.lng, heading: target.heading ?? 0 };
        shownRef.current = shown;
      }
      const catchUp = 1 - Math.exp(-dt * 8);
      shown.lat += (target.lat - shown.lat) * catchUp;
      shown.lng += (target.lng - shown.lng) * catchUp;
      if (target.heading != null) {
        const turn = ((target.heading - shown.heading + 540) % 360) - 180;
        shown.heading = (shown.heading + turn * (1 - Math.exp(-dt * 12)) + 360) % 360;
      }
      marker.setLngLat([shown.lng, shown.lat]);
      const face = marker.getElement().querySelector(".zana-arrow-face") as HTMLElement | null;
      if (face) face.style.transform = `rotate(${shown.heading}deg)`;
      if (movedMetres(ringAt, shown) > 0.6) {
        ringAt = { lat: shown.lat, lng: shown.lng };
        const ring = map.getSource("you-ring") as import("maplibre-gl").GeoJSONSource | undefined;
        const accuracy = Math.max(12, Math.min(target.accuracy || 24, 80));
        ring?.setData({ type: "FeatureCollection", features: [ringPolygon(shown.lat, shown.lng, accuracy)] });
      }
      if (!followRef.current || paused.current || target.heading == null) return;
      const look = 70 * 2 ** (17 - map.getZoom());
      const ahead = metresAhead(shown.lat, shown.lng, shown.heading, look);
      const center = map.getCenter();
      const drift = movedMetres({ lat: center.lat, lng: center.lng }, { lat: ahead[1], lng: ahead[0] });
      const bearingDelta = Math.abs(((shown.heading - map.getBearing() + 540) % 360) - 180);
      if (drift < 0.3 && bearingDelta < 0.3) return;
      map.jumpTo({ center: ahead, bearing: shown.heading });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !cameraTick || !camera) return;
    const here = youRef.current;
    if (camera === "follow") {
      paused.current = false;
      setPausedUi(false);
      lastCam.current = null;
      if (!here) return;
      const face = here.heading ?? map.getBearing();
      map.jumpTo({
        center: metresAhead(here.lat, here.lng, face, 70),
        bearing: face,
        zoom: Math.max(map.getZoom(), 16.8),
      });
      return;
    }
    paused.current = true;
    setPausedUi(false);
    if (!here) return;
    if (camera === "you") {
      map.easeTo({
        center: [here.lng, here.lat],
        zoom: 17,
        bearing: here.heading ?? 0,
        pitch: 0,
        offset: [0, 0],
        duration: 550,
      });
    }
    if (camera === "both") {
      const pts = [[here.lng, here.lat], ...pinsRef.current.map((p) => [p.lng, p.lat])];
      map.fitBounds(
        [
          [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))],
          [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))],
        ],
        { padding: { top: 168, bottom: 168, left: 168, right: 64 }, maxZoom: 16.2, duration: 600 },
      );
    }
  }, [camera, cameraTick, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !fitTick) return;
    const pts = pinsRef.current.map((p) => [p.lng, p.lat]);
    const here = youRef.current;
    if (here) pts.push([here.lng, here.lat]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.easeTo({ center: pts[0] as [number, number], zoom: 16.4, pitch: 0, duration: 600 });
      return;
    }
    map.fitBounds(
      [
        [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))],
        [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))],
      ],
      { padding: { top: 96, bottom: 88, left: 36, right: 36 }, maxZoom: 16.2, duration: 700 },
    );
  }, [ready, fitTick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !streetTick) return;
    const here = youRef.current;
    const pin = pinsRef.current[0];
    const target = here || pin;
    if (!target) return;
    map.easeTo({
      center: [target.lng, target.lat],
      zoom: 16.8,
      pitch: 0,
      bearing: 0,
      duration: 700,
    });
  }, [ready, streetTick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let last = "";
    const paint = () => {
      const src = map.getSource("focus-building") as import("maplibre-gl").GeoJSONSource | undefined;
      if (!src) return;
      const spot = spotlightRef.current;
      const empty = { type: "FeatureCollection" as const, features: [] };
      if (!spot) {
        if (last !== "") {
          last = "";
          src.setData(empty);
        }
        return;
      }
      const pixel = map.project([spot.lng, spot.lat]);
      const pointHits = map.queryRenderedFeatures(pixel, { layers: ["building"] });
      const boxHits =
        pointHits.length > 0
          ? pointHits
          : map.queryRenderedFeatures(
              [
                [pixel.x - 18, pixel.y - 18],
                [pixel.x + 18, pixel.y + 18],
              ],
              { layers: ["building"] },
            );
      const hit = boxHits.find(
        (feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon",
      );
      const key = hit?.geometry ? JSON.stringify(hit.geometry) : "";
      if (key === last) return;
      last = key;
      if (!hit?.geometry) {
        src.setData(empty);
        return;
      }
      src.setData({
        type: "Feature",
        geometry: hit.geometry,
        properties: {},
      });
    };
    paint();
    map.on("idle", paint);
    return () => {
      map.off("idle", paint);
    };
  }, [ready, spotlight]);

  function resumeFollow() {
    const map = mapRef.current;
    paused.current = false;
    setPausedUi(false);
    if (!map || !you) return;
    lastCam.current = null;
    map.easeTo({
      center: [you.lng, you.lat],
      bearing: you.heading ?? 0,
      zoom: Math.max(map.getZoom(), 16.5),
      pitch: 0,
      offset: [0, 90],
      duration: 500,
    });
  }

  const full = height === "full";

  return (
    <div className={full ? "relative h-full w-full" : "relative"}>
      {mapReady === false ? (
        <div
          className="flex items-center justify-center bg-[#efeae2] px-6 text-center text-sm text-stone-600"
          style={full ? { height: "100%" } : { height }}
        >
          Downloading the map of Zambia. Streets and buildings show up when that file is ready.
        </div>
      ) : (
        <div
          ref={el}
          style={full ? { height: "100%", width: "100%" } : { height, width: "100%" }}
          className={full ? "h-full w-full" : "overflow-hidden rounded-[28px] ring-1 ring-stone-200"}
        />
      )}
      {inspected && !onInspect ? (
        <div className="absolute left-3 top-3 z-10 max-w-[70%] truncate rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-900 shadow">
          {inspected}
        </div>
      ) : null}
      {follow && pausedUi && you ? (
        <button
          type="button"
          onClick={resumeFollow}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow"
        >
          My location
        </button>
      ) : null}
    </div>
  );
}
