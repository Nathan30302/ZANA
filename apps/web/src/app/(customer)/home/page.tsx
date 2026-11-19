"use client";

import { ProCard, ProCardData } from "@/components/pro-card";
import { BrandWordmark, Chip, EmptyState, Input, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useHere } from "@/lib/use-here";
import { appointmentIsUpcoming, lusakaDay, lusakaTime, lusakaWhen } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NextBooking = {
  id: string;
  status: string;
  scheduledAt: string;
  locationType: string;
  service: { name: string; durationMin: number };
  professional: { displayName: string };
};

const CATEGORIES = ["All", "Haircut", "Fade", "Braids", "Nails", "Makeup", "Salon", "Home Service"];

export default function HomePage() {
  const [pros, setPros] = useState<ProCardData[]>([]);
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<NextBooking | null>(null);
  const { here, fromGps } = useHere();

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    api<{ bookings: NextBooking[] }>("/api/bookings?scope=customer")
      .then((data) => {
        const upcoming = data.bookings
          .filter((b) => appointmentIsUpcoming(b.status, b.scheduledAt, b.service.durationMin))
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setNext(upcoming[0] || null);
      })
      .catch(() => setNext(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "All") params.set("category", category);
        if (query) params.set("q", query);
        if (fromGps) params.set("sort", "distance");
        params.set("lat", String(here.lat));
        params.set("lng", String(here.lng));
        const data = await api<{ professionals: ProCardData[] }>(`/api/professionals?${params}`);
        if (!cancelled) setPros(data.professionals);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, query, here, fromGps]);

  const top = useMemo(() => pros.slice(0, 8), [pros]);
  const dayLine = `${lusakaDay(new Date())} · ${fromGps ? "Near you" : "Lusaka"}`;
  const listTitle = query
    ? `Results for “${query}”`
    : category !== "All"
      ? category
      : fromGps
        ? "Pros near you"
        : "Top in Lusaka";

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <div className="flex items-start justify-between gap-3">
        <BrandWordmark mark={46} subtitle={dayLine} />
        <Link
          href="/messages"
          className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-800 ring-1 ring-stone-200"
        >
          Messages
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <Input
          className="pl-11"
          placeholder="Search barbers, braids, nails…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {!fromGps ? (
        <p className="text-xs text-stone-500">
          Allow location and distances start from where you are. For now they start in central Lusaka.
        </p>
      ) : null}

      {next ? (
        <div className="flex items-center gap-3 rounded-[28px] bg-stone-950 px-4 py-4 text-white shadow-lg shadow-stone-900/15">
          <Link href={`/bookings/${next.id}`} className="flex min-w-0 flex-1 items-center gap-4">
            <div className="w-16 shrink-0 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {lusakaWhen(new Date(next.scheduledAt))}
              </div>
              <div className="font-display text-3xl leading-none">{lusakaTime(new Date(next.scheduledAt))}</div>
            </div>
            <div className="min-w-0 border-l border-white/15 pl-4">
              <div className="truncate font-semibold">{next.service.name}</div>
              <div className="truncate text-sm text-white/70">{next.professional.displayName}</div>
              <div className="text-sm text-white/70">
                {next.locationType === "AT_HOME" ? "At your home" : "At the shop"}
              </div>
            </div>
          </Link>
          <Link
            href={`/bookings/${next.id}/track`}
            className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-900"
          >
            Route
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/explore?homeService=1" className="rounded-[24px] bg-rose-800 p-4 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-100">At your door</div>
          <div className="font-display mt-2 text-[22px] leading-none">They come to you</div>
        </Link>
        <Link href="/explore?map=1" className="rounded-[24px] bg-stone-950 p-4 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Around Lusaka</div>
          <div className="font-display mt-2 text-[22px] leading-none">Open the map</div>
        </Link>
      </div>

      <div>
        <SectionTitle
          title={listTitle}
          action={
            <Link href="/explore" className="text-sm font-semibold text-rose-800">
              See all
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-stone-100" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <EmptyState title="Nothing matches" body="Try another name, or switch the category back to All." />
        ) : (
          <div className="space-y-4">
            {top.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
