"use client";

import { ProCard, ProCardData } from "@/components/pro-card";
import { Chip, EmptyState, Input, SectionTitle } from "@/components/ui";
import { ZanaMap } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import { formatDistance, useHere } from "@/lib/use-here";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ExploreInner() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const [pros, setPros] = useState<ProCardData[]>([]);
  const [q, setQ] = useState("");
  const [homeOnly, setHomeOnly] = useState(searchParams.get("homeService") === "1");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("distance");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { here, fromGps, ready } = useHere();

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (homeOnly) params.set("homeService", "1");
    if (minRating) params.set("minRating", String(minRating));
    params.set("sort", sort);
    params.set("lat", String(here.lat));
    params.set("lng", String(here.lng));
    api<{ professionals: ProCardData[] }>(`/api/professionals?${params}`)
      .then((d) => {
        if (!cancelled) setPros(d.professionals);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, homeOnly, minRating, sort, here]);

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Explore" />
      <Input placeholder="Search services or pros" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="flex flex-wrap gap-2">
        <Chip
          active={sort === "distance"}
          onClick={() => {
            if (sort === "distance") {
              setSort("rating");
              return;
            }
            setSort("distance");
            setHomeOnly(false);
            setMinRating(0);
          }}
        >
          Near me
        </Chip>
        <Chip active={homeOnly} onClick={() => setHomeOnly((v) => !v)}>
          Home Service
        </Chip>
        <Chip active={minRating >= 4.5} onClick={() => setMinRating(minRating >= 4.5 ? 0 : 4.5)}>
          4.5+ Ratings
        </Chip>
        <Chip active={sort === "price"} onClick={() => setSort(sort === "price" ? "rating" : "price")}>
          Price
        </Chip>
      </div>

      <div className="flex rounded-2xl bg-stone-100 p-1">
        {(["list", "map"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize ${
              view === v ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            {v} view
          </button>
        ))}
      </div>

      {view === "list" ? (
        loading ? (
          <div className="h-56 animate-pulse rounded-3xl bg-stone-100" />
        ) : pros.length === 0 ? (
          <EmptyState title="No one nearby" body="Try another search, or turn off a filter." />
        ) : (
          <div className="space-y-4">
            {pros.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {ready ? (
            <ZanaMap
              key={`${here.lat.toFixed(2)},${here.lng.toFixed(2)}`}
              center={here}
              zoom={fromGps ? 14 : 12}
              height={380}
              you={fromGps ? here : null}
              pins={pros
                .filter((p) => p.lat != null && p.lng != null)
                .map((p) => ({
                  id: p.id,
                  lat: p.lat as number,
                  lng: p.lng as number,
                  label: `${p.displayName.split(" ")[0]} · ${p.distanceKm != null ? formatDistance(p.distanceKm) : "–"}`,
                  href: `/pros/${p.id}`,
                }))}
            />
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-[28px] bg-[#efeae2] text-sm text-stone-600">
              Finding where you are…
            </div>
          )}
          <p className="text-xs text-stone-500">
            {fromGps
              ? "Distances are from where you are. Pinch in to read building names. Tap a pin to open the place."
              : "Allow location to measure from where you are. Until then, distances start in central Lusaka."}
          </p>
          <div className="space-y-3">
            {pros.slice(0, 4).map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-stone-500">Loading explore…</div>}>
      <ExploreInner />
    </Suspense>
  );
}
