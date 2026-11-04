"use client";

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
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markers = useRef<import("maplibre-gl").Marker[]>([]);
  const pickMarker = useRef<import("maplibre-gl").Marker | null>(null);
  const youMarker = useRef<import("maplibre-gl").Marker | null>(null);
  const onPickRef = useRef(onPick);
  const followRef = useRef(follow);
  const paused = useRef(false);
  const fitted = useRef("");
  const lastCam = useRef<{ lat: number; lng: number; heading: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [mapReady, setMapReady] = useState<boolean | null>(null);
  const [pausedUi, setPausedUi] = useState(false);
  onPickRef.current = onPick;
  followRef.current = follow;

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
      map.on("dragstart", () => {
        if (!followRef.current) return;
        paused.current = true;
        setPausedUi(true);
      });
      map.on("load", () => {
        if (!map) return;
        map.resize();
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
      return;
    }
    const accuracy = Math.max(12, Math.min(you.accuracy || 24, 80));
    ring?.setData({ type: "FeatureCollection", features: [ringPolygon(you.lat, you.lng, accuracy)] });
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled) return;
      const heading = you.heading;
      if (!youMarker.current) {
        const node = document.createElement("div");
        node.className = "zana-arrow";
        node.title = "You are here";
        node.innerHTML =
          '<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><path d="M20 2 L35 36 L20 28 L5 36 Z" fill="#1d4ed8" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        youMarker.current = new maplibregl.Marker({ element: node, anchor: "center", rotationAlignment: "map" })
          .setLngLat([you.lng, you.lat])
          .addTo(map);
      } else {
        youMarker.current.setLngLat([you.lng, you.lat]);
      }
      const tracking = follow && !paused.current;
      if (tracking) {
        const prev = lastCam.current;
        const moved = !prev || movedMetres(prev, you) > 4;
        const turned = heading != null && (!prev || Math.abs(heading - prev.heading) > 8);
        if (moved || turned || !prev) {
          lastCam.current = { lat: you.lat, lng: you.lng, heading: heading ?? prev?.heading ?? 0 };
          map.easeTo({
            center: [you.lng, you.lat],
            bearing: heading ?? map.getBearing(),
            zoom: Math.max(map.getZoom(), 16.5),
            pitch: 0,
            offset: [0, 90],
            duration: prev ? 700 : 400,
            essential: true,
          });
        }
        youMarker.current.setRotation(0);
      } else if (heading != null) {
        youMarker.current.setRotation(heading);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [you, ready, follow]);

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
