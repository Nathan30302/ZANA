"use client";

import { Badge, Card } from "@/components/ui";
import { formatDistance } from "@/lib/use-here";
import { formatZmw } from "@/lib/utils";

export type ProCardData = {
  id: string;
  displayName: string;
  category: string;
  coverUrl: string | null;
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  homeService: boolean;
  area: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceKm?: number | null;
  etaMin?: number | null;
  minPrice?: number;
  maxPrice?: number;
};

export function ProCard({ pro }: { pro: ProCardData }) {
  const distance =
    pro.distanceKm != null
      ? `${formatDistance(pro.distanceKm)}${pro.etaMin ? ` · ${pro.etaMin} min` : ""}`
      : "Lusaka";

  return (
    <Card href={`/pros/${pro.id}`} className="overflow-hidden p-0">
      <div className="relative h-52 w-full overflow-hidden bg-stone-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pro.coverUrl || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80"}
          alt={pro.displayName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
        <div className="absolute left-3 top-3 flex gap-2">
          {pro.homeService ? <Badge tone="orange">Comes to you</Badge> : null}
          {pro.verified ? <Badge tone="rose">Verified</Badge> : null}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display truncate text-2xl leading-tight">{pro.displayName}</h3>
              <p className="mt-0.5 truncate text-sm text-white/80">
                {pro.category}
                {pro.area ? ` · ${pro.area}` : ""}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-900">
              ★ {pro.ratingAvg.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="font-medium text-rose-800">{distance}</span>
        <span className="font-semibold text-stone-900">
          {pro.minPrice != null ? `from ${formatZmw(pro.minPrice)}` : "View prices"}
        </span>
      </div>
    </Card>
  );
}
