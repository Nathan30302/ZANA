"use client";

import { Button, Card, Input } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [commissionPercent, setCommissionPercent] = useState(12);
  const [homeCommissionPercent, setHomeCommissionPercent] = useState(10);
  const [minFloatZmw, setMinFloatZmw] = useState(50);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ settings: { commissionPercent: number; homeCommissionPercent: number; minFloatZmw: number } }>(
      "/api/admin/stats",
    )
      .then((d) => {
        if (d.settings) {
          setCommissionPercent(d.settings.commissionPercent);
          setHomeCommissionPercent(d.settings.homeCommissionPercent);
          setMinFloatZmw(d.settings.minFloatZmw);
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  async function save() {
    await api("/api/admin/settings", {
      method: "PATCH",
      json: { commissionPercent, homeCommissionPercent, minFloatZmw },
    });
    setMsg("Commission settings saved");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Commission settings</h1>
        <p className="mt-1 text-stone-500">
          Platform takes a percentage from the professional float after completed bookings.
        </p>
      </div>
      <Card className="space-y-3">
        <label className="block text-sm font-medium">Shop / standard commission %</label>
        <Input
          type="number"
          value={commissionPercent}
          onChange={(e) => setCommissionPercent(Number(e.target.value))}
        />
        <label className="block text-sm font-medium">Home service commission %</label>
        <Input
          type="number"
          value={homeCommissionPercent}
          onChange={(e) => setHomeCommissionPercent(Number(e.target.value))}
        />
        <label className="block text-sm font-medium">Minimum float (ZMW)</label>
        <Input type="number" value={minFloatZmw} onChange={(e) => setMinFloatZmw(Number(e.target.value))} />
        <Button onClick={save}>Save settings</Button>
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      </Card>
    </div>
  );
}
