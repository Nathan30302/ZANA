"use client";

import { PlaceMap } from "@/components/map-screen";
import { Badge, Button, Card, StarRow } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatDistance, useHere } from "@/lib/use-here";
import { driveMinutes, formatZmw, haversineKm, whatsappHref } from "@/lib/utils";
import { ArrowLeft, Heart, Home, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceZmw: number;
  homeEligible: boolean;
  category: string;
};

type Professional = {
  id: string;
  displayName: string;
  bio: string | null;
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  homeService: boolean;
  travelFeeZmw: number;
  area: string | null;
  address: string | null;
  coverUrl: string | null;
  category: string;
  lat: number | null;
  lng: number | null;
  user: { phone: string; name: string | null };
  services: Service[];
  portfolio: { id: string; url: string; caption: string | null }[];
  bookings: {
    review: { rating: number; comment: string | null } | null;
    customer: { name: string | null };
  }[];
};

export default function ProProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pro, setPro] = useState<Professional | null>(null);
  const [fav, setFav] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const { here, fromGps } = useHere();

  useEffect(() => {
    api<{ professional: Professional }>(`/api/professionals/${id}`).then((d) => setPro(d.professional));
    api<{ favorites: { id: string }[] }>("/api/favorites")
      .then((d) => setFav(d.favorites.some((f) => f.id === id)))
      .catch(() => setFav(false));
  }, [id]);

  async function openChat() {
    setChatBusy(true);
    try {
      const data = await api<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        json: { professionalId: id },
      });
      router.push(`/messages/${data.conversation.id}`);
    } catch {
      router.push("/login");
    } finally {
      setChatBusy(false);
    }
  }

  async function toggleFav() {
    try {
      if (fav) {
        await api("/api/favorites", { method: "DELETE", json: { professionalId: id } });
        setFav(false);
      } else {
        await api("/api/favorites", { method: "POST", json: { professionalId: id } });
        setFav(true);
      }
    } catch {
      router.push("/login");
    }
  }

  if (!pro) {
    return <div className="mobile-shell p-6 text-sm text-stone-500">Loading profile…</div>;
  }

  const awayKm =
    fromGps && pro.lat != null && pro.lng != null
      ? haversineKm(here, { lat: pro.lat, lng: pro.lng })
      : null;

  return (
    <div className="mobile-shell pb-28">
      <div className="relative h-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pro.coverUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80"}
          alt={pro.displayName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 rounded-full bg-white/90 p-2"
        >
          <ArrowLeft size={18} />
        </button>
        <button onClick={toggleFav} className="absolute right-4 top-4 rounded-full bg-white/90 p-2">
          <Heart size={18} className={fav ? "fill-rose-700 text-rose-700" : ""} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl">{pro.displayName}</h1>
            {pro.verified ? <Badge tone="orange">Verified</Badge> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/90">
            <StarRow rating={pro.ratingAvg} light />
            <span>({pro.ratingCount} reviews)</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {pro.area || "Lusaka"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">
        {pro.homeService ? (
          <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <Home size={16} /> Home service available · travel from {formatZmw(pro.travelFeeZmw)}
          </div>
        ) : null}

        <p className="text-sm leading-relaxed text-stone-600">{pro.bio}</p>

        {pro.lat != null && pro.lng != null ? (
          <div className="space-y-2">
            <p className="text-sm text-stone-500">{pro.address || pro.area || "Lusaka"}</p>
            {awayKm != null ? (
              <p className="text-sm font-medium text-stone-800">
                {formatDistance(awayKm)} from you · about {driveMinutes(awayKm)} min by car
              </p>
            ) : null}
            <PlaceMap place={{ lat: pro.lat, lng: pro.lng, label: pro.displayName }} />
          </div>
        ) : null}

        <div>
          <h2 className="font-display mb-3 text-xl">Services</h2>
          <div className="space-y-2">
            {pro.services.map((s) => (
              <Card key={s.id} href={`/pros/${pro.id}/book?service=${s.id}`} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-stone-500">
                    {s.durationMin} min
                    {s.homeEligible ? " · Home eligible" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatZmw(s.priceZmw)}</div>
                  <div className="text-xs font-semibold text-rose-800">Book</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {pro.portfolio.length ? (
          <div>
            <h2 className="font-display mb-3 text-xl">Portfolio</h2>
            <div className="grid grid-cols-3 gap-2">
              {pro.portfolio.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.caption || ""}
                  className="aspect-square rounded-2xl object-cover"
                />
              ))}
            </div>
          </div>
        ) : null}

        {pro.bookings.filter((b) => b.review).length ? (
          <div>
            <h2 className="font-display mb-3 text-xl">Reviews</h2>
            <div className="space-y-2">
              {pro.bookings
                .filter((b) => b.review)
                .map((b, i) => (
                  <Card key={i}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{b.customer.name || "Customer"}</div>
                      <StarRow rating={b.review!.rating} />
                    </div>
                    {b.review?.comment ? (
                      <p className="mt-2 text-sm text-stone-600">{b.review.comment}</p>
                    ) : null}
                  </Card>
                ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-200 bg-white/95 p-4 backdrop-blur">
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled={chatBusy} onClick={openChat}>
            Chat
          </Button>
          <a
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            href={whatsappHref(pro.user.phone, `Hi ${pro.displayName}, I found you on Zana.`)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <Link href={`/pros/${pro.id}/book`} className="flex-[1.3]">
            <Button className="w-full">Book Now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
