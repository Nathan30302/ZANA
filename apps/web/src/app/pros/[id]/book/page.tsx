"use client";

import { Button, Card, Chip, Input, TextArea } from "@/components/ui";
import { ZanaMap } from "@/components/zana-map";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import { addDays, format, setHours, setMinutes } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceZmw: number;
  homeEligible: boolean;
};

type Professional = {
  id: string;
  displayName: string;
  homeService: boolean;
  travelFeeZmw: number;
  address: string | null;
  services: Service[];
};

export default function BookFlowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pro, setPro] = useState<Professional | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [locationType, setLocationType] = useState<"AT_HOME" | "AT_SHOP">("AT_SHOP");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState({ lat: -15.4167, lng: 28.2833 });
  const [note, setNote] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    api<{ professional: Professional }>(`/api/professionals/${id}`).then((d) => {
      setPro(d.professional);
      if (d.professional.services[0]) setServiceId(d.professional.services[0].id);
      if (d.professional.homeService) setLocationType("AT_HOME");
    });
  }, [id]);

  const service = useMemo(
    () => pro?.services.find((s) => s.id === serviceId) || null,
    [pro, serviceId],
  );

  useEffect(() => {
    if (!serviceId || !date) return;
    api<{ slots: string[] }>(`/api/professionals/${id}/slots?date=${date}&serviceId=${serviceId}`).then(
      (d) => {
        setSlots(d.slots);
        setTime(d.slots[0] || "");
      },
    );
  }, [id, date, serviceId]);

  const travel =
    locationType === "AT_HOME" && pro ? pro.travelFeeZmw : 0;
  const total = (service?.priceZmw || 0) + travel;

  async function confirm() {
    if (!service || !time) return;
    setLoading(true);
    setError("");
    try {
      const [hh, mm] = time.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(new Date(date), hh), mm).toISOString();
      const data = await api<{ booking: { id: string } }>("/api/bookings", {
        method: "POST",
        json: {
          professionalId: id,
          serviceId,
          scheduledAt,
          locationType,
          address: locationType === "AT_HOME" ? address : undefined,
          customerLat: locationType === "AT_HOME" ? pin.lat : undefined,
          customerLng: locationType === "AT_HOME" ? pin.lng : undefined,
          customerNote: note || undefined,
        },
      });
      setDoneId(data.booking.id);
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
      if (String(e).includes("Unauthorized") || String((e as Error).message).includes("Unauthorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!pro || !service) {
    return <div className="mobile-shell p-6 text-sm text-stone-500">Loading booking…</div>;
  }

  if (step === 6 && doneId) {
    return (
      <div className="mobile-shell flex min-h-dvh flex-col justify-center px-6 text-center">
        <div className="animate-fade-up space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
            ✓
          </div>
          <h1 className="font-display text-3xl">Booking requested</h1>
          <p className="text-stone-600">
            {service.name} with {pro.displayName} on {format(new Date(date), "EEE d MMM")} at {time}.
          </p>
          <Card className="text-left text-sm">
            <div className="flex justify-between">
              <span>Total</span>
              <strong>{formatZmw(total)}</strong>
            </div>
            <div className="mt-2 text-stone-500">
              {locationType === "AT_HOME" ? `At home · ${address}` : `At shop · ${pro.address}`}
            </div>
          </Card>
          <Button className="w-full" onClick={() => router.push(`/bookings/${doneId}`)}>
            View booking
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => router.push("/bookings")}>
            All bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-shell min-h-dvh px-4 pb-10 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => (step > 1 ? setStep(step - 1) : router.back())} className="text-sm font-semibold text-stone-600">
          Back
        </button>
        <div className="text-sm text-stone-500">Step {Math.min(step, 5)} / 5</div>
      </div>

      <h1 className="font-display text-3xl text-stone-900">Book {pro.displayName}</h1>

      {step === 1 ? (
        <div className="mt-6 space-y-3">
          <h2 className="font-semibold">Select service</h2>
          {pro.services.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={`w-full rounded-3xl border p-4 text-left ${
                serviceId === s.id ? "border-rose-800 bg-rose-50" : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-stone-500">{s.durationMin} min</div>
                </div>
                <div className="font-semibold">{formatZmw(s.priceZmw)}</div>
              </div>
            </button>
          ))}
          <Button className="mt-4 w-full" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <h2 className="font-semibold">Choose date & time</h2>
          <div className="flex gap-2 overflow-x-auto">
            {Array.from({ length: 10 }).map((_, i) => {
              const d = addDays(new Date(), i);
              const value = format(d, "yyyy-MM-dd");
              return (
                <Chip key={value} active={date === value} onClick={() => setDate(value)}>
                  {format(d, "EEE d")}
                </Chip>
              );
            })}
          </div>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {slots.length === 0 ? (
              <p className="text-sm text-stone-500">No slots this day — try another date.</p>
            ) : (
              slots.map((s) => (
                <Chip key={s} active={time === s} onClick={() => setTime(s)}>
                  {s}
                </Chip>
              ))
            )}
          </div>
          <Button className="w-full" disabled={!time} onClick={() => setStep(3)}>
            Continue
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-4">
          <h2 className="font-semibold">Where should we meet?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={!pro.homeService || !service.homeEligible}
              onClick={() => setLocationType("AT_HOME")}
              className={`rounded-3xl border p-4 text-left ${
                locationType === "AT_HOME" ? "border-rose-800 bg-rose-50" : "border-stone-200"
              } disabled:opacity-40`}
            >
              <div className="font-semibold">At Home</div>
              <div className="mt-1 text-xs text-stone-500">+ travel fee</div>
            </button>
            <button
              onClick={() => setLocationType("AT_SHOP")}
              className={`rounded-3xl border p-4 text-left ${
                locationType === "AT_SHOP" ? "border-rose-800 bg-rose-50" : "border-stone-200"
              }`}
            >
              <div className="font-semibold">At Shop</div>
              <div className="mt-1 text-xs text-stone-500">{pro.address || "Pro location"}</div>
            </button>
          </div>
          {locationType === "AT_HOME" ? (
            <div className="space-y-2">
              <p className="text-sm text-stone-500">
                Drop the pin on your building. The map uses OpenStreetMap, the same kind of map as Maps.me.
              </p>
              <ZanaMap
                center={pin}
                zoom={15}
                height={280}
                pick={pin}
                onPick={async (lat, lng) => {
                  setPin({ lat, lng });
                  try {
                    const place = await api<{ label: string }>(
                      `/api/geo/reverse?lat=${lat}&lng=${lng}`,
                    );
                    setAddress(place.label);
                  } catch {
                    setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                  }
                }}
              />
              <TextArea
                rows={2}
                placeholder="Building, road, area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          ) : null}
          <TextArea
            rows={2}
            placeholder="Notes for your pro (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            className="w-full"
            disabled={locationType === "AT_HOME" && !address.trim()}
            onClick={() => setStep(4)}
          >
            Continue
          </Button>
        </div>
      ) : null}

      {step === 4 || step === 5 ? (
        <div className="mt-6 space-y-4">
          <h2 className="font-semibold">Review & confirm</h2>
          <Card className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{service.name}</span>
              <span>{formatZmw(service.priceZmw)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Travel fee</span>
              <span>{formatZmw(travel)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatZmw(total)}</span>
            </div>
            <div className="pt-2 text-stone-500">
              {format(new Date(date), "EEE d MMM")} · {time} ·{" "}
              {locationType === "AT_HOME" ? "At Home" : "At Shop"}
            </div>
          </Card>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" disabled={loading} onClick={confirm}>
            {loading ? "Booking…" : "Confirm booking"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
