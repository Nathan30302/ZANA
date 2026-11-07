"use client";

import { LogoMark } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const OPENING_MS = 3600;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem("zana_onboarded");
    const t = setTimeout(() => {
      router.replace(seen ? "/home" : "/onboarding");
    }, OPENING_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="zana-splash mobile-shell relative min-h-dvh overflow-hidden text-white">
      <div className="zana-flow zana-flow-a" />
      <div className="zana-flow zana-flow-b" />
      <div className="zana-flow zana-flow-c" />
      <div className="zana-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="relative">
          <div className="zana-orbit" />
          <div className="zana-orbit zana-orbit-2" />
          <div className="zana-mark relative flex h-28 w-28 items-center justify-center rounded-full bg-[#fffaf8] shadow-[0_0_60px_rgba(234,88,12,0.55)]">
            <LogoMark size={78} alt="" />
            <div className="zana-sweep" />
          </div>
        </div>
        <div className="mt-10 text-center">
          <h1 className="zana-word font-display text-6xl font-semibold leading-none">Zana</h1>
          <div className="zana-rule" />
          <p className="mt-3 text-[11px] uppercase tracking-[0.32em] text-orange-50/90">Beauty on your fingertips</p>
        </div>
      </div>
    </div>
  );
}
