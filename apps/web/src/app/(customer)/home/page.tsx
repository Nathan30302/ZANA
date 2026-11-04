"use client";

import { ProCard, ProCardData } from "@/components/pro-card";
import { Badge, BrandWordmark, Chip, Input, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CATEGORIES = ["All", "Haircut", "Fade", "Braids", "Nails", "Makeup", "Salon", "Home Service"];

export default function HomePage() {
  const [pros, setPros] = useState<ProCardData[]>([]);
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "All") params.set("category", category);
        if (q.trim()) params.set("q", q.trim());
        params.set("lat", "-15.4167");
        params.set("lng", "28.2833");
        const data = await api<{ professionals: ProCardData[] }>(`/api/professionals?${params}`);
        if (!cancelled) setPros(data.professionals);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, q]);

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
              <MapPin size={14} className="text-rose-800" /> Lusaka
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
