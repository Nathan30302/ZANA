"use client";

import { Badge, Card, StarRow } from "@/components/ui";
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
  return (
    <Card href={`/pros/${pro.id}`} className="overflow-hidden p-0">
      <div className="relative h-40 w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pro.coverUrl || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80"}
          alt={pro.displayName}
          className="h-full w-full object-cover"
        />
        {pro.homeService ? (
          <div className="absolute left-3 top-3">
            <Badge tone="orange">Home Service</Badge>
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-stone-900">{pro.displayName}</h3>
              {pro.verified ? (
                <span className="rounded-full bg-rose-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ✓
                </span>
              ) : null}
            </div>
            <p className="text-sm text-stone-500">
              {pro.category}
              {pro.area ? ` · ${pro.area}` : ""}
            </p>
          </div>
          <StarRow rating={pro.ratingAvg || 0} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-rose-800">
            {pro.distanceKm != null
              ? `${pro.distanceKm.toFixed(1)} km${pro.etaMin ? ` · ${pro.etaMin} min` : ""}`
              : "Lusaka"}
          </span>
          <span className="font-semibold text-stone-900">
            {pro.minPrice != null ? `from ${formatZmw(pro.minPrice)}` : "View prices"}
          </span>
        </div>
      </div>
    </Card>
  );
}
