"use client";

import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Application = {
  id: string;
  displayName: string;
  status: string;
  category: string;
  area: string | null;
  homeService: boolean;
  bio: string | null;
  coverUrl: string | null;
  user: { phone: string; name: string | null };
  documents: { id: string; kind: string; url: string }[];
  services: { name: string; priceZmw: number }[];
  portfolio: { url: string }[];
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);

  async function load() {
    const data = await api<{ applications: Application[] }>("/api/admin/applications");
    setApps(data.applications);
  }

  useEffect(() => {
    load().catch(() => router.replace("/admin/login"));
  }, [router]);

  async function act(id: string, action: "APPROVE" | "REJECT" | "SUSPEND") {
    await api(`/api/admin/applications/${id}`, {
      method: "PATCH",
      json: { action, reason: action === "REJECT" ? "Incomplete documents" : undefined },
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Applications</h1>
        <p className="mt-1 text-stone-500">Review ID documents, portfolio, and approve quality pros.</p>
      </div>
      <div className="space-y-4">
        {apps.map((app) => (
          <Card key={app.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{app.displayName}</h2>
                  <Badge tone={app.status === "APPROVED" ? "green" : app.status === "PENDING" ? "orange" : "stone"}>
                    {app.status === "PENDING" ? "Waiting" : app.status === "APPROVED" ? "Live" : app.status === "REJECTED" ? "Declined" : app.status}
                  </Badge>
                </div>
                <p className="text-sm text-stone-500">
                  {app.user.name || "—"} · {app.user.phone} · {app.category} · {app.area}
                  {app.homeService ? " · Home service" : ""}
                </p>
              </div>
              {app.status === "PENDING" ? (
                <div className="flex gap-2">
                  <Button onClick={() => act(app.id, "APPROVE")}>Approve</Button>
                  <Button variant="secondary" onClick={() => act(app.id, "REJECT")}>
                    Reject
                  </Button>
                </div>
              ) : app.status === "APPROVED" ? (
                <Button variant="danger" onClick={() => act(app.id, "SUSPEND")}>
                  Suspend
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-stone-600">{app.bio}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {app.services.map((s) => (
                <span key={s.name} className="rounded-full bg-stone-100 px-3 py-1">
                  {s.name} · {formatZmw(s.priceZmw)}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {app.documents.map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-rose-800">
                  {d.kind} doc →
                </a>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(app.coverUrl ? [app.coverUrl, ...app.portfolio.map((p) => p.url)] : app.portfolio.map((p) => p.url))
                .slice(0, 5)
                .map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
