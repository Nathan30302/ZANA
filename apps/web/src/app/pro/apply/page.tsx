"use client";

import { Button, Input, TextArea } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    displayName: "",
    type: "INDEPENDENT",
    category: "Barber",
    bio: "",
    area: "Roma",
    address: "",
    homeService: true,
    travelFeeZmw: 50,
    idDocumentUrl: "https://placehold.co/600x400/png?text=NRC+Upload",
    portfolioUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
    serviceName: "Signature Haircut",
    servicePrice: 100,
    serviceDuration: 40,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/pro/apply", {
        method: "POST",
        json: {
          fullName: form.fullName,
          displayName: form.displayName,
          type: form.type,
          category: form.category,
          bio: form.bio,
          area: form.area,
          address: form.address || `${form.area}, Lusaka`,
          homeService: form.homeService,
          travelFeeZmw: Number(form.travelFeeZmw),
          idDocumentUrl: form.idDocumentUrl,
          portfolioUrls: [form.portfolioUrl],
          coverUrl: form.portfolioUrl,
          services: [
            {
              name: form.serviceName,
              category: form.category,
              durationMin: Number(form.serviceDuration),
              priceZmw: Number(form.servicePrice),
              homeEligible: form.homeService,
            },
          ],
        },
      });
      router.replace("/pro");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="font-display text-3xl">Join Zana as a pro</h1>
      <p className="mt-2 text-sm text-stone-500">
        Submit your application. Admins review ID + portfolio before you go live.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <Input placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
        <Input placeholder="Business / display name" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} required />
        <select
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
        >
          <option value="INDEPENDENT">Independent professional</option>
          <option value="SHOP">Salon / Barbershop</option>
        </select>
        <Input placeholder="Category (Barber, Nails…)" value={form.category} onChange={(e) => set("category", e.target.value)} />
        <Input placeholder="Area (Roma, CBD…)" value={form.area} onChange={(e) => set("area", e.target.value)} />
        <Input placeholder="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <TextArea rows={3} placeholder="Bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.homeService}
            onChange={(e) => set("homeService", e.target.checked)}
          />
          Offer home service
        </label>
        <Input
          type="number"
          placeholder="Travel fee (ZMW)"
          value={form.travelFeeZmw}
          onChange={(e) => set("travelFeeZmw", Number(e.target.value))}
        />
        <Input placeholder="ID document URL" value={form.idDocumentUrl} onChange={(e) => set("idDocumentUrl", e.target.value)} />
        <Input placeholder="Portfolio photo URL" value={form.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} />
        <div className="rounded-3xl bg-rose-50 p-4">
          <div className="mb-2 text-sm font-semibold text-rose-900">Primary service</div>
          <div className="space-y-2">
            <Input value={form.serviceName} onChange={(e) => set("serviceName", e.target.value)} placeholder="Service name" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={form.servicePrice} onChange={(e) => set("servicePrice", Number(e.target.value))} placeholder="Price ZMW" />
              <Input type="number" value={form.serviceDuration} onChange={(e) => set("serviceDuration", Number(e.target.value))} placeholder="Minutes" />
            </div>
          </div>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </div>
  );
}
