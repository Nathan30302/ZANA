"use client";

import { Button, Card, Input, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatZmw } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";

type Txn = {
  id: string;
  type: string;
  amountZmw: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export default function ProEarningsPage() {
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [amount, setAmount] = useState(200);
  const [provider, setProvider] = useState<"MTN" | "AIRTEL" | "CARD">("MTN");
  const [msg, setMsg] = useState("");
  const [bookings, setBookings] = useState<
    { id: string; status: string; servicePriceZmw: number; travelFeeZmw: number; scheduledAt: string; service: { name: string } }[]
  >([]);

  async function load() {
    const f = await api<{ balanceZmw: number; transactions: Txn[] }>("/api/pro/float");
    setBalance(f.balanceZmw);
    setTxns(f.transactions);
    const b = await api<{ bookings: typeof bookings }>("/api/bookings?scope=pro");
    setBookings(b.bookings.filter((x) => x.status === "COMPLETED"));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const totalEarnings = bookings.reduce((s, b) => s + b.servicePriceZmw + b.travelFeeZmw, 0);

  async function topUp() {
    setMsg("");
    await api("/api/pro/float", {
      method: "POST",
      json: { amountZmw: amount, provider },
    });
    setMsg(`Top-up via ${provider} successful (demo).`);
    await load();
  }

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <SectionTitle title="Earnings" />
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-stone-500">Total completed</div>
          <div className="mt-1 text-2xl font-semibold">{formatZmw(totalEarnings)}</div>
        </Card>
        <Card>
          <div className="text-xs text-stone-500">Float wallet</div>
          <div className="mt-1 text-2xl font-semibold">{formatZmw(balance)}</div>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="font-semibold">Top up float</div>
        <p className="text-sm text-stone-500">
          Commission is deducted from your float after completed bookings. Top up with MTN MoMo or Airtel Money.
        </p>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <div className="flex gap-2">
          {(["MTN", "AIRTEL", "CARD"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                provider === p ? "bg-rose-800 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <Button onClick={topUp} className="w-full">
          Top up {formatZmw(amount)}
        </Button>
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Recent float activity</h2>
        <div className="space-y-2">
          {txns.map((t) => (
            <Card key={t.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{t.type.replace("_", " ")}</div>
                <div className="text-stone-500">
                  {format(new Date(t.createdAt), "d MMM HH:mm")} · {t.note}
                </div>
              </div>
              <div className={t.amountZmw >= 0 ? "text-emerald-700" : "text-rose-800"}>
                {t.amountZmw >= 0 ? "+" : ""}
                {formatZmw(t.amountZmw)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Payout / completed jobs</h2>
        <div className="space-y-2">
          {bookings.slice(0, 10).map((b) => (
            <Card key={b.id} className="flex justify-between text-sm">
              <div>
                <div className="font-medium">{b.service.name}</div>
                <div className="text-stone-500">{format(new Date(b.scheduledAt), "d MMM yyyy")}</div>
              </div>
              <div className="font-semibold">{formatZmw(b.servicePriceZmw + b.travelFeeZmw)}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
