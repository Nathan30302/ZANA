"use client";

import { Badge, Button, Card, Input, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProProfilePage() {
  const router = useRouter();
  const [pro, setPro] = useState<{
    displayName: string;
    verified: boolean;
    ratingAvg: number;
    status: string;
    bio: string | null;
    homeService: boolean;
    floatBalanceZmw: number;
    services: { id: string; name: string; priceZmw: number; durationMin: number; homeEligible: boolean }[];
  } | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "Barber",
    durationMin: 30,
    priceZmw: 80,
    homeEligible: true,
  });
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api<{
      professional: NonNullable<typeof pro> | null;
    }>("/api/pro/apply");
    setPro(data.professional);
  }

  useEffect(() => {
    load().catch(() => router.replace("/pro/login"));
  }, [router]);

  async function addService() {
    await api("/api/pro/services", { method: "POST", json: serviceForm });
    setMsg("Service added");
    setServiceForm((f) => ({ ...f, name: "" }));
    await load();
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/pro/login");
  }

  if (!pro) return <div className="p-6 text-sm text-stone-500">Loading…</div>;

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Profile" />
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl">{pro.displayName}</h1>
          {pro.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="stone">{pro.status}</Badge>}
        </div>
        <div className="text-sm text-stone-500">★ {pro.ratingAvg.toFixed(1)} · Float {formatZmw(pro.floatBalanceZmw)}</div>
        <p className="text-sm text-stone-600">{pro.bio}</p>
      </Card>

      <Card className="space-y-3">
        <div className="font-semibold">Services</div>
        {pro.services.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-stone-500">
                {s.durationMin} min{s.homeEligible ? " · Home" : ""}
              </div>
            </div>
            <div className="font-semibold">{formatZmw(s.priceZmw)}</div>
          </div>
        ))}
        <div className="border-t border-stone-100 pt-3 space-y-2">
          <div className="text-sm font-semibold">Add service</div>
          <Input
            placeholder="Name"
            value={serviceForm.name}
            onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={serviceForm.priceZmw}
              onChange={(e) => setServiceForm({ ...serviceForm, priceZmw: Number(e.target.value) })}
            />
            <Input
              type="number"
              value={serviceForm.durationMin}
              onChange={(e) => setServiceForm({ ...serviceForm, durationMin: Number(e.target.value) })}
            />
          </div>
          <Button onClick={addService} className="w-full" disabled={!serviceForm.name}>
            Save service
          </Button>
          {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
        </div>
      </Card>

      <Card className="space-y-2 text-sm text-stone-600">
        <div className="font-semibold text-stone-900">Settings</div>
        <p>Availability defaults: Mon–Sat 09:00–18:00 (seeded / on apply).</p>
        <p>Payments & payouts: manage float on the Earnings tab.</p>
        <p>Account security: phone OTP login.</p>
      </Card>

      <Button variant="secondary" className="w-full" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
