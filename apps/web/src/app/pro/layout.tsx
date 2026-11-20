"use client";

import { BottomNav } from "@/components/bottom-nav";
import { usePathname } from "next/navigation";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav =
    pathname.startsWith("/pro/login") ||
    pathname.startsWith("/pro/apply") ||
    pathname.startsWith("/pro/onboarding");

  return (
    <div className="mobile-shell">
      <div className={hideNav ? "min-h-dvh" : "min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))]"}>{children}</div>
      {!hideNav ? <BottomNav variant="pro" /> : null}
    </div>
  );
}
