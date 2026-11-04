"use client";

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

type Point = { lat: number; lng: number; accuracy?: number };

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  pins?: MapPin[];
  route?: [number, number][];
  height?: number;
  pick?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  you?: Point | null;
};

const STYLE = "https://tiles.openfreemap.org/styles/liberty";

function ringPolygon(lat: number, lng: number, radiusM: number) {
  const earth = 6378137;
  const coords: [number, number][] = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * Math.PI * 2;
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

export function ZanaMap({
  center,
  zoom = 16,
  pins = [],
  route = [],
  height = 340,
  pick,
  onPick,
  you,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markers = useRef<import("maplibre-gl").Marker[]>([]);
  const pickMarker = useRef<import("maplibre-gl").Marker | null>(null);
  const youMarker = useRef<import("maplibre-gl").Marker | null>(null);
  const onPickRef = useRef(onPick);
  const fitted = useRef("");
  const [ready, setReady] = useState(false);
  onPickRef.current = onPick;

  useEffect(() => {
    let dead = false;
    let map: import("maplibre-gl").Map | null = null;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (dead || !el.current || mapRef.current) return;
      map = new maplibregl.Map({
        container: el.current,
        style: STYLE,
        center: [center.lng, center.lat],
        zoom,
        pitch: zoom >= 15 ? 48 : 0,
        bearing: -8,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.on("load", () => {
        if (!map) return;
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#9f1239",
            "line-width": 6,
            "line-opacity": 0.92,
          },
        });
        map.addSource("you-ring", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "you-ring-fill",
          type: "fill",
          source: "you-ring",
          paint: { "fill-color": "#2563eb", "fill-opacity": 0.15 },
        });
        mapRef.current = map;
        setReady(true);
      });
    })();
    return () => {
      dead = true;
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      pickMarker.current?.remove();
      youMarker.current?.remove();
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const node = document.createElement("button");
        node.type = "button";
        node.textContent = p.label;
        node.style.cssText = `background:${p.color || "#9f1239"};color:#fff;font:700 11px/1.2 system-ui,sans-serif;padding:5px 8px;border-radius:999px;border:0;box-shadow:0 6px 16px rgba(28,25,23,.25);white-space:nowrap`;
        const marker = new maplibregl.Marker({ element: node, anchor: "bottom" })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        if (p.href) node.onclick = () => { window.location.href = p.href!; };
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
      if (route.length > 1 && fitKey !== fitted.current) {
        fitted.current = fitKey;
        const lngs = route.map((p) => p[1]);
        const lats = route.map((p) => p[0]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 48, maxZoom: 16, duration: 600 },
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pins, route, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !pick) return;
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled) return;
      if (!pickMarker.current) {
        const node = document.createElement("div");
        node.style.cssText =
          "width:22px;height:22px;border-radius:50% 50% 50% 0;background:#9f1239;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.3)";
        const marker = new maplibregl.Marker({ element: node, anchor: "bottom", draggable: true })
          .setLngLat([pick.lng, pick.lat])
          .addTo(map);
        marker.on("dragend", () => {
          const ll = marker.getLngLat();
          onPickRef.current?.(ll.lat, ll.lng);
        });
        map.on("click", (event) => {
          marker.setLngLat(event.lngLat);
          onPickRef.current?.(event.lngLat.lat, event.lngLat.lng);
        });
        pickMarker.current = marker;
        map.easeTo({ center: [pick.lng, pick.lat], zoom: Math.max(map.getZoom(), 16), pitch: 50, duration: 500 });
      } else {
        const current = pickMarker.current.getLngLat();
        if (Math.abs(current.lat - pick.lat) > 0.0002 || Math.abs(current.lng - pick.lng) > 0.0002) {
          pickMarker.current.setLngLat([pick.lng, pick.lat]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pick, ready]);

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
    const accuracy = Math.max(12, Math.min(you.accuracy || 25, 80));
    ring?.setData({ type: "FeatureCollection", features: [ringPolygon(you.lat, you.lng, accuracy)] });
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled) return;
      if (!youMarker.current) {
        const node = document.createElement("div");
        node.className = "zana-you-dot";
        node.title = "You are here";
        youMarker.current = new maplibregl.Marker({ element: node, anchor: "center" })
          .setLngLat([you.lng, you.lat])
          .addTo(map);
      } else {
        youMarker.current.setLngLat([you.lng, you.lat]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [you, ready]);

  function showWhereIAm() {
    const map = mapRef.current;
    const target = you || pick || pins[0];
    if (!map || !target) return;
    map.easeTo({
      center: [target.lng, target.lat],
      zoom: 17,
      pitch: 55,
      duration: 700,
    });
  }

  return (
    <div className="relative">
      <div ref={el} style={{ height, width: "100%" }} className="overflow-hidden rounded-[28px] ring-1 ring-stone-200" />
      <button
        type="button"
        onClick={showWhereIAm}
        className="absolute bottom-3 left-3 z-10 rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow"
      >
        Buildings · where I am
      </button>
    </div>
  );
}
