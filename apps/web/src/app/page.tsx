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
    }, 1200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="mobile-shell relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#ffe4e6,transparent_55%),radial-gradient(circle_at_bottom,#ffedd5,transparent_45%)]" />
      <div className="relative z-10 text-center animate-fade-up">
        <LogoMark size={96} className="mx-auto animate-pulse-soft" />
        <h1 className="font-display mt-6 text-4xl font-semibold tracking-tight text-stone-900">Zana</h1>
        <p className="mt-2 text-base text-stone-600">Beauty on your fingertips</p>
      </div>

      {showCta ? (
        <div className="relative z-10 mt-12 w-full max-w-sm space-y-3 animate-fade-up">
          <Link href="/onboarding">
            <Button className="w-full">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              I already have an account
            </Button>
          </Link>
          <div className="flex justify-center gap-4 pt-2 text-sm text-stone-500">
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
  );
}
