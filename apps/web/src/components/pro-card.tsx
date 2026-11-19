"use client";

import { Card } from "@/components/ui";
import { tripLine } from "@/lib/use-here";
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
  const distance = tripLine(pro.distanceKm);

  return (
    <Card href={`/pros/${pro.id}`} className="flex items-stretch gap-3 p-3">
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-stone-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pro.coverUrl || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80"}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-stone-900">{pro.displayName}</h3>
            <span className="shrink-0 text-sm font-semibold text-stone-900">★ {pro.ratingAvg.toFixed(1)}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-stone-500">
            {pro.category}
            {pro.area ? ` · ${pro.area}` : ""}
            {pro.verified ? " · Verified" : ""}
          </p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-rose-800">{distance}</div>
            {pro.homeService ? <div className="text-[11px] font-semibold text-orange-700">Comes to you</div> : null}
          </div>
          <div className="shrink-0 text-sm font-semibold text-stone-900">
            {pro.minPrice != null ? `from ${formatZmw(pro.minPrice)}` : "Prices"}
          </div>
        </div>
      </div>
    </Card>
  );
}
