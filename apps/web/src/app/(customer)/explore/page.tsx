"use client";

import { ProCard, ProCardData } from "@/components/pro-card";
import { Chip, Input, SectionTitle } from "@/components/ui";
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
        <div className="space-y-3 rounded-[28px] bg-white p-4 ring-1 ring-stone-100">
          <div className="relative h-64 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#fecdd3,#ffedd5)]">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#9f1239_1px,transparent_1px)] [background-size:18px_18px]" />
            {pros.slice(0, 8).map((pro, i) => (
              <a
                key={pro.id}
                href={`/pros/${pro.id}`}
                className="absolute rounded-full bg-rose-800 px-2.5 py-1 text-[10px] font-bold text-white shadow"
                style={{
                  left: `${12 + ((i * 17) % 70)}%`,
                  top: `${18 + ((i * 23) % 60)}%`,
                }}
                title={pro.displayName}
              >
                {pro.displayName.split(" ")[0]}
              </a>
            ))}
          </div>
          <p className="text-sm text-stone-500">
            Map pins for Lusaka demo — tap a name to open the profile. List view shows full cards.
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
