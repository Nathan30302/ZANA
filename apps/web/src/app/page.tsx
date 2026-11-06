"use client";

import { Button, LogoMark } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SplashPage() {
  const router = useRouter();
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("zana_onboarded");
    const t = setTimeout(() => {
      if (seen) router.replace("/home");
      else setShowCta(true);
    }, 1700);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="zana-splash mobile-shell relative flex min-h-dvh flex-col overflow-hidden text-white">
      <div className="zana-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative">
          <div className="zana-orbit" />
          <div className="zana-orbit zana-orbit-2" />
          <div className="zana-mark relative flex h-28 w-28 items-center justify-center rounded-full bg-[#fffaf8] shadow-[0_0_48px_rgba(234,88,12,0.45)]">
            <LogoMark size={78} alt="" />
            <div className="zana-sweep" />
          </div>
        </div>
        <div className="mt-10 text-center">
          <h1 className="zana-word font-display text-6xl font-semibold leading-none">Zana</h1>
          <div className="zana-rule" />
          <p className="mt-3 text-[11px] uppercase tracking-[0.32em] text-orange-100/80">Beauty on your fingertips</p>
        </div>

        {showCta ? (
          <div className="mt-12 w-full max-w-sm space-y-3 animate-fade-up">
            <Link href="/onboarding">
              <Button className="w-full">Get started</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                I already have an account
              </Button>
            </Link>
            <div className="flex justify-center gap-4 pt-2 text-sm text-white/60">
              <Link href="/pro/login" className="underline-offset-2 hover:underline">
                Pro login
              </Link>
              <Link href="/admin/login" className="underline-offset-2 hover:underline">
                Admin
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
