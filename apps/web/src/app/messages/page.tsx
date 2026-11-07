"use client";

import { Card, EmptyState } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Conversation = {
  id: string;
  updatedAt: string;
  customer: { id: string; name: string | null };
  proUser: {
    id: string;
    name: string | null;
    professional: { displayName: string } | null;
  };
  messages: { body: string; createdAt: string }[];
};

export default function MessagesPage() {
  const router = useRouter();
  const [me, setMe] = useState<string>("");
  const [rows, setRows] = useState<Conversation[]>([]);

  useEffect(() => {
    api<{ user: { id: string } | null }>("/api/auth/me").then((d) => {
      if (!d.user) router.replace("/login");
      else setMe(d.user.id);
    });
    api<{ conversations: Conversation[] }>("/api/conversations")
      .then((d) => setRows(d.conversations))
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="mobile-shell space-y-4 px-4 py-6">
      <button onClick={() => router.back()} className="text-sm font-semibold text-stone-600">
        Back
      </button>
      <h1 className="font-display text-3xl">Messages</h1>
      {rows.length === 0 ? (
        <EmptyState title="No chats yet" body="Open a professional and tap Chat or WhatsApp." />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => {
            const title =
              c.customer.id === me
                ? c.proUser.professional?.displayName || c.proUser.name || "Professional"
                : c.customer.name || "Customer";
            const last = c.messages[0];
            return (
              <Card key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-800 text-sm font-semibold text-white">
                  {title.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate font-semibold">{title}</div>
                    <div className="shrink-0 text-[11px] text-stone-400">
                      {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-sm text-stone-500">
                    {last?.body || "Start the conversation"}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
