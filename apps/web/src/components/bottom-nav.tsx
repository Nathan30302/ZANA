"use client";

import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Compass,
  Home,
  UserRound,
  Wallet,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const customerTabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const proTabs = [
  { href: "/pro", label: "Home", icon: Home },
  { href: "/pro/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/pro/earnings", label: "Earnings", icon: Wallet },
  { href: "/pro/profile", label: "Profile", icon: UserRound },
];

export function BottomNav({ variant }: { variant: "customer" | "pro" }) {
  const pathname = usePathname();
  const tabs = variant === "customer" ? customerTabs : proTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid grid-cols-4 gap-1 py-2">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/home" && tab.href !== "/pro" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                active ? "bg-rose-50 text-rose-800" : "text-stone-500",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
