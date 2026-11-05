"use client";

import { haversineKm } from "@/lib/utils";
import { useEffect, useState } from "react";

export const LUSAKA = { lat: -15.4167, lng: 28.2833 };

export function inZambia(point: { lat: number; lng: number }) {
  return point.lat > -18.2 && point.lat < -8.1 && point.lng > 21.8 && point.lng < 33.9;
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Where the person is, or central Lusaka when location is off or outside Zambia. */
export function useHere() {
  const [here, setHere] = useState(LUSAKA);
  const [fromGps, setFromGps] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stop = window.setTimeout(() => setReady(true), 4000);
    if (!navigator.geolocation) {
      setReady(true);
      return () => window.clearTimeout(stop);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!inZambia(point)) {
          setFromGps(false);
          setHere(LUSAKA);
          setReady(true);
          return;
        }
        setFromGps(true);
        setHere((prev) => (haversineKm(prev, point) < 0.04 ? prev : point));
        setReady(true);
      },
      () => {
        setFromGps(false);
        setHere(LUSAKA);
        setReady(true);
      },
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 10000 },
    );
    return () => {
      window.clearTimeout(stop);
      navigator.geolocation.clearWatch(id);
    };
  }, []);

  return { here, fromGps, ready };
}
