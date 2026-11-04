"use client";

import { Badge, Button, Card, LogoMark, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Pro = {
  id: string;
  displayName: string;
  status: string;
  verified: boolean;
  floatBalanceZmw: number;
};

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  servicePriceZmw: number;
  travelFeeZmw: number;
  service: { name: string };
  customer: { name: string | null; phone: string };
};

export default function ProHomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [pro, setPro] = useState<Pro | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<{
          user: { name: string | null; role: string; professional: Pro | null } | null;
        }>("/api/auth/me");
        if (!me.user) {
          router.replace("/pro/login");
          return;
        }
        setUserName(me.user.name || "Pro");
        if (!me.user.professional) {
          router.replace("/pro/apply");
          return;
        }
        setPro(me.user.professional);
        if (me.user.professional.status === "PENDING") {
          // still show dashboard with pending banner
        }
        const b = await api<{ bookings: Booking[] }>("/api/bookings?scope=pro");
        setBookings(b.bookings);
      } catch {
        router.replace("/pro/login");
      }
    })();
  }, [router]);

  const today = useMemo(
    () => bookings.filter((b) => isSameDay(new Date(b.scheduledAt), new Date())),
    [bookings],
  );
  const upcoming = useMemo(
    () =>
      bookings.filter(
        (b) =>
          ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(b.status) &&
          new Date(b.scheduledAt).getTime() >= Date.now() - 3600_000,
      ),
    [bookings],
  );
  const earningsToday = today
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.servicePriceZmw + b.travelFeeZmw, 0);

  async function updateStatus(id: string, status: string) {
    await api(`/api/bookings/${id}`, { method: "PATCH", json: { status } });
    const b = await api<{ bookings: Booking[] }>("/api/bookings?scope=pro");
    setBookings(b.bookings);
  }

  if (!pro) {
    return <div className="p-6 text-sm text-stone-500">Loading pro dashboard…</div>;
  }

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-stone-500">Good day,</div>
          <h1 className="font-display text-3xl">{userName}</h1>
        </div>
        <LogoMark size={44} />
      </div>

      {pro.status !== "APPROVED" ? (
        <Card className="bg-amber-50 ring-amber-100">
          <div className="font-semibold text-amber-900">Application {pro.status.toLowerCase()}</div>
          <p className="mt-1 text-sm text-amber-800">
            {pro.status === "PENDING"
              ? "Admins usually review within 24–48 hours. You can’t receive public bookings yet."
              : "Update your application or contact support."}
          </p>
          <Link href="/pro/apply" className="mt-3 inline-block text-sm font-semibold text-rose-800">
            View application →
          </Link>
        </Card>
      ) : (
        <div className="flex items-center gap-2">
          {pro.verified ? <Badge tone="green">Verified</Badge> : null}
          <Badge>Live on Zana</Badge>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="text-[11px] text-stone-500">Today</div>
          <div className="mt-1 text-xl font-semibold">{today.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-stone-500">Earned</div>
          <div className="mt-1 text-xl font-semibold">{formatZmw(earningsToday)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-stone-500">Float</div>
          <div className="mt-1 text-xl font-semibold">{formatZmw(pro.floatBalanceZmw)}</div>
        </Card>
      </div>

      <div>
        <SectionTitle title="Today’s appointments" />
        {today.length === 0 ? (
          <Card className="text-sm text-stone-500">No appointments scheduled today.</Card>
        ) : (
          <div className="space-y-3">
            {today.map((b) => (
              <Card key={b.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{b.service.name}</div>
                    <div className="text-sm text-stone-500">
                      {b.customer.name || b.customer.phone} · {format(new Date(b.scheduledAt), "HH:mm")}
                    </div>
                  </div>
                  <Badge>{b.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "REQUESTED" ? (
                    <>
                      <Button className="flex-1" onClick={() => updateStatus(b.id, "ACCEPTED")}>
                        Accept
                      </Button>
                      <Button variant="secondary" className="flex-1" onClick={() => updateStatus(b.id, "DECLINED")}>
                        Decline
                      </Button>
                    </>
                  ) : null}
                  {b.status === "ACCEPTED" ? (
                    <Button className="w-full" onClick={() => updateStatus(b.id, "IN_PROGRESS")}>
                      Start service
                    </Button>
                  ) : null}
                  {b.status === "IN_PROGRESS" ? (
                    <Button className="w-full" onClick={() => updateStatus(b.id, "COMPLETED")}>
                      Complete
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle title="Upcoming" />
        <div className="space-y-2">
          {upcoming.slice(0, 5).map((b) => (
            <Card key={b.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{b.service.name}</div>
                <div className="text-stone-500">{format(new Date(b.scheduledAt), "EEE d MMM HH:mm")}</div>
              </div>
              <Badge tone="stone">{b.status}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
