"use client";

import { haversineKm } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export type LiveFix = {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  /** Metres per second, when the phone reports it. */
  speed?: number | null;
};

function angDiff(a: number, b: number) {
  return ((a - b + 540) % 360) - 180;
}

function bearingDegrees(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const y = Math.sin(((to.lng - from.lng) * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180);
  const x =
    Math.cos((from.lat * Math.PI) / 180) * Math.sin((to.lat * Math.PI) / 180) -
    Math.sin((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.cos(((to.lng - from.lng) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Direction the top of the phone is pointing, clockwise from north. */
function compassDegrees(event: DeviceOrientationEvent, absoluteEvent: boolean) {
  const ios = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
  if (typeof ios.webkitCompassHeading === "number" && !Number.isNaN(ios.webkitCompassHeading)) {
    return (ios.webkitCompassHeading + 360) % 360;
  }
  if (event.alpha == null || (!event.absolute && !absoluteEvent)) return null;
  const { alpha, beta, gamma } = event;
  if (beta == null || gamma == null) return (360 - alpha + 360) % 360;
  const deg = Math.PI / 180;
  const x = beta * deg;
  const y = gamma * deg;
  const z = alpha * deg;
  const vx = -(Math.cos(z) * Math.sin(y) + Math.sin(z) * Math.sin(x) * Math.cos(y));
  const vy = -(Math.sin(z) * Math.sin(y) - Math.cos(z) * Math.sin(x) * Math.cos(y));
  let compass = Math.atan(vx / vy);
  if (vy < 0) compass += Math.PI;
  else if (vx < 0) compass += 2 * Math.PI;
  return ((compass * 180) / Math.PI + 360) % 360;
}

/** iOS only grants the compass inside a tap. Android ignores this. */
export function askCompass() {
  const orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  orientation.requestPermission?.().catch(() => undefined);
}

/** Fires with the direction the top of the phone is pointing. */
export function watchCompass(onHeading: (degrees: number) => void) {
  const onAbs = (event: Event) => {
    const next = compassDegrees(event as DeviceOrientationEvent, true);
    if (next != null) onHeading(next);
  };
  const onRel = (event: Event) => {
    const next = compassDegrees(event as DeviceOrientationEvent, false);
    if (next != null) onHeading(next);
  };
  window.addEventListener("deviceorientationabsolute", onAbs, true);
  window.addEventListener("deviceorientation", onRel, true);
  return () => {
    window.removeEventListener("deviceorientationabsolute", onAbs, true);
    window.removeEventListener("deviceorientation", onRel, true);
  };
}

export function useLiveFix(active: boolean) {
  const [fix, setFix] = useState<LiveFix | null>(null);
  const [note, setNote] = useState("");
  const lastFix = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const suspect = useRef<{ lat: number; lng: number } | null>(null);
  const headingRef = useRef<number | null>(null);
  const publishedHeading = useRef<number | null>(null);
  const lastHeadingPublish = useRef(0);
  const compassAt = useRef(0);
  const lastPost = useRef(0);
  const onLive = useRef<((point: LiveFix) => void) | null>(null);

  useEffect(() => {
    if (!active || !navigator.geolocation) {
      if (active) setNote("Allow location to see the arrow where you are.");
      return;
    }
    const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };

    function pushHeading(next: number, force: boolean) {
      headingRef.current = next;
      const now = Date.now();
      const prev = publishedHeading.current;
      if (!force && prev != null && Math.abs(angDiff(next, prev)) < 8 && now - lastHeadingPublish.current < 400) return;
      if (!force && now - lastHeadingPublish.current < 120) return;
      lastHeadingPublish.current = now;
      publishedHeading.current = next;
      setFix((current) => (current ? { ...current, heading: next } : current));
    }

    function onFix(pos: GeolocationPosition) {
      const now = Date.now();
      const point = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
      };
      const prev = lastFix.current;
      const metres = prev ? haversineKm(prev, point) * 1000 : Infinity;
      const seconds = prev ? Math.max(0.2, (now - prev.at) / 1000) : 1;
      if (prev && metres / seconds > 45) {
        const held = suspect.current;
        const agrees = held != null && haversineKm(held, point) * 1000 < 30;
        suspect.current = { lat: point.lat, lng: point.lng };
        if (!agrees) return;
      } else {
        suspect.current = null;
      }
      const speed = pos.coords.speed;
      const walking = !prev || metres > 0.8 || (speed != null && speed > 0.3 && metres > 0.3);
      if (!walking) return;
      if (prev && metres > 4 && now - compassAt.current > 2500) {
        pushHeading(bearingDegrees(prev, point), true);
      }
      lastFix.current = { lat: point.lat, lng: point.lng, at: now };
      const course =
        pos.coords.heading != null && pos.coords.heading >= 0 && now - compassAt.current > 2500
          ? pos.coords.heading
          : headingRef.current;
      if (course != null) headingRef.current = course;
      setFix({ ...point, heading: course });
      setNote("");
      if (onLive.current && now - lastPost.current > 8000) {
        lastPost.current = now;
        onLive.current({ ...point, heading: headingRef.current });
      }
    }

    let attempts = 0;
    function onFail(error: GeolocationPositionError) {
      if (error.code !== 1 && attempts < 3) {
        attempts += 1;
        window.setTimeout(() => navigator.geolocation.getCurrentPosition(onFix, onFail, options), 1200);
        return;
      }
      setNote("Allow location to see the arrow where you are.");
    }

    const id = navigator.geolocation.watchPosition(onFix, onFail, options);

    const stopCompass = watchCompass((next) => {
      compassAt.current = Date.now();
      pushHeading(next, false);
    });
    return () => {
      navigator.geolocation.clearWatch(id);
      stopCompass();
    };
  }, [active]);

  return { fix, note, setNote, onLive };
}
