"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  href?: string;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  pins?: MapPin[];
  route?: [number, number][];
  height?: number;
  pick?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
};

export function ZanaMap({ center, zoom = 13, pins = [], route = [], height = 340, pick, onPick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const pinsLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const lineRef = useRef<import("leaflet").Polyline | null>(null);
  const pickRef = useRef<import("leaflet").Marker | null>(null);
  const Lref = useRef<typeof import("leaflet") | null>(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);
  onPickRef.current = onPick;

  useEffect(() => {
    let dead = false;
    (async () => {
      const L = await import("leaflet");
      if (dead || !el.current || mapRef.current) return;
      const map = L.map(el.current, { zoomControl: true }).setView([center.lat, center.lng], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      pinsLayer.current = L.layerGroup().addTo(map);
      lineRef.current = L.polyline([], { color: "#9f1239", weight: 5, opacity: 0.9 }).addTo(map);
      mapRef.current = map;
      Lref.current = L;
      setReady(true);
    })();
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
      pinsLayer.current = null;
      lineRef.current = null;
      pickRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = Lref.current;
    const map = mapRef.current;
    const group = pinsLayer.current;
    if (!ready || !L || !map || !group) return;
    group.clearLayers();
    pins.forEach((p) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${p.color || "#9f1239"};color:#fff;font:700 11px/1.2 system-ui,sans-serif;padding:5px 8px;border-radius:999px;box-shadow:0 6px 16px rgba(28,25,23,.2);white-space:nowrap">${p.label}</div>`,
        iconAnchor: [12, 10],
      });
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(group);
      if (p.href) marker.on("click", () => { window.location.href = p.href!; });
    });
    if (lineRef.current) {
      lineRef.current.setLatLngs(route);
    }
    if (route.length > 1) {
      map.fitBounds(L.latLngBounds(route), { padding: [36, 36], maxZoom: 15 });
    }
  }, [pins, route, ready]);

  useEffect(() => {
    const L = Lref.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !pick) return;
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#9f1239;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.25)"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 22],
    });
    if (!pickRef.current) {
      const marker = L.marker([pick.lat, pick.lng], { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        onPickRef.current?.(ll.lat, ll.lng);
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        onPickRef.current?.(e.latlng.lat, e.latlng.lng);
      });
      pickRef.current = marker;
      map.setView([pick.lat, pick.lng], 15);
    } else {
      const current = pickRef.current.getLatLng();
      if (Math.abs(current.lat - pick.lat) > 0.0002 || Math.abs(current.lng - pick.lng) > 0.0002) {
        pickRef.current.setLatLng([pick.lat, pick.lng]);
      }
    }
  }, [pick, ready]);

  return (
    <div
      ref={el}
      style={{ height, width: "100%" }}
      className="z-0 overflow-hidden rounded-[28px] ring-1 ring-stone-200"
    />
  );
}
