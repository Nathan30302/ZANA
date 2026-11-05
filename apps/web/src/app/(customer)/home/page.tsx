"use client";

import { ProCard, ProCardData } from "@/components/pro-card";
import { Badge, BrandWordmark, Chip, EmptyState, Input, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useHere } from "@/lib/use-here";
import { formatLusaka } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NextBooking = {
  id: string;
  status: string;
  scheduledAt: string;
  service: { name: string };
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
          .filter((b) => ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(b.status))
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
  }, [category, query, here]);

  const top = useMemo(() => pros.slice(0, 6), [pros]);

  return (
    <div className="space-y-6 px-4 pb-6 pt-5">
      <div className="flex items-start justify-between gap-3">
        <BrandWordmark subtitle="Beauty on your fingertips" />
        <div className="flex items-center gap-2">
          <Link
            href="/messages"
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-800 ring-1 ring-stone-200"
          >
            Messages
          </Link>
          <div className="rounded-full bg-white px-3 py-2 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} className="text-rose-800" /> {fromGps ? "Near you" : "Lusaka"}
            </span>
          </div>
        </div>
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

      <div className="flex gap-2 overflow-x-auto pb-1">
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
        <Link href={`/bookings/${next.id}`} className="block rounded-[28px] bg-white p-4 ring-1 ring-stone-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-800">Next booking</div>
          <div className="mt-1 font-semibold text-stone-900">{next.service.name}</div>
          <div className="text-sm text-stone-500">
            {next.professional.displayName} · {formatLusaka(new Date(next.scheduledAt))}
          </div>
        </Link>
      ) : null}

      <Link
        href="/explore?homeService=1"
        className="block overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-800 to-rose-950 p-5 text-white shadow-lg shadow-rose-900/20"
      >
        <Badge tone="orange">Featured</Badge>
        <h2 className="font-display mt-3 text-2xl">Home service, on tap</h2>
        <p className="mt-2 max-w-[28ch] text-sm text-rose-100">
          Verified pros come to your door across Lusaka. Book in minutes.
        </p>
      </Link>

      <div>
        <SectionTitle
          title="Top professionals"
          action={
            <Link href="/explore" className="text-sm font-semibold text-rose-800">
              See all
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-stone-100" />
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
