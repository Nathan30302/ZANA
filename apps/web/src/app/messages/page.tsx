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
              <Card key={c.id} href={`/messages/${c.id}`}>
                <div className="font-semibold">{title}</div>
                <div className="mt-1 line-clamp-1 text-sm text-stone-500">
                  {last?.body || "Start the conversation"}
                </div>
                <div className="mt-2 text-xs text-stone-400">
                  {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
