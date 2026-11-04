"use client";

import { ProCard, ProCardData } from "@/components/pro-card";
import { Chip, Input, SectionTitle } from "@/components/ui";
import { ZanaMap } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ExploreInner() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const [pros, setPros] = useState<ProCardData[]>([]);
  const [q, setQ] = useState("");
  const [homeOnly, setHomeOnly] = useState(searchParams.get("homeService") === "1");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("rating");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (homeOnly) params.set("homeService", "1");
    if (minRating) params.set("minRating", String(minRating));
    params.set("sort", sort);
    params.set("lat", "-15.4167");
    params.set("lng", "28.2833");
    api<{ professionals: ProCardData[] }>(`/api/professionals?${params}`).then((d) =>
      setPros(d.professionals),
    );
  }, [q, homeOnly, minRating, sort]);

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Explore" />
      <Input placeholder="Search services or pros" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="flex flex-wrap gap-2">
        <Chip active={!homeOnly && minRating === 0} onClick={() => { setHomeOnly(false); setMinRating(0); }}>
          Near Me
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
        <Chip active={sort === "distance"} onClick={() => setSort(sort === "distance" ? "rating" : "distance")}>
          Distance
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
        <div className="space-y-4">
          {pros.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <ZanaMap
            center={{ lat: -15.41, lng: 28.32 }}
            zoom={12}
            height={380}
            pins={pros
              .filter((p) => p.lat != null && p.lng != null)
              .map((p) => ({
                id: p.id,
                lat: p.lat as number,
                lng: p.lng as number,
                label: `${p.displayName.split(" ")[0]} · ${p.distanceKm?.toFixed(1) ?? "–"} km`,
                href: `/pros/${p.id}`,
              }))}
          />
          <p className="text-xs text-stone-500">
            Pinch or use Buildings · where I am to see house shapes. Tap a name to open the profile.
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
