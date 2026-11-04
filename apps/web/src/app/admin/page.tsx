"use client";

import { Card } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    customers: number;
    professionals: number;
    pendingApplications: number;
    bookings: number;
    completedBookings: number;
    gmvZmw: number;
    commissionZmw: number;
  } | null>(null);

  useEffect(() => {
    api<{ stats: NonNullable<typeof stats> }>("/api/admin/stats")
      .then((d) => setStats(d.stats))
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  if (!stats) return <div className="text-sm text-stone-500">Loading admin…</div>;

  const cards = [
    { label: "Customers", value: stats.customers },
    { label: "Approved pros", value: stats.professionals },
    { label: "Pending apps", value: stats.pendingApplications },
    { label: "Bookings", value: stats.bookings },
    { label: "Completed", value: stats.completedBookings },
    { label: "GMV", value: formatZmw(stats.gmvZmw) },
    { label: "Commission", value: formatZmw(stats.commissionZmw) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Overview</h1>
        <p className="mt-1 text-stone-500">Lusaka marketplace health at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="text-xs uppercase tracking-wide text-stone-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </Card>
        ))}
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Review applications</div>
          <p className="text-sm text-stone-500">{stats.pendingApplications} waiting for approval</p>
        </div>
        <Link href="/admin/applications" className="rounded-2xl bg-rose-800 px-4 py-3 text-sm font-semibold text-white">
          Open queue
        </Link>
      </Card>
    </div>
  );
}
