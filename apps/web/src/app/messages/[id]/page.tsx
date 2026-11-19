"use client";

import { ChatThread } from "@/components/chat-thread";
import { api } from "@/lib/api-client";
import { whatsappHref } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState("");
  const [title, setTitle] = useState("Chat");
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await api<{ user: { id: string } | null }>("/api/auth/me");
      if (!session.user) {
        router.replace("/login");
        return;
      }
      setMe(session.user.id);
      const data = await api<{
        conversation: {
          customer: { id: string; name: string | null; phone: string };
          proUser: {
            id: string;
            name: string | null;
            phone: string;
            professional: { displayName: string } | null;
          };
        };
      }>(`/api/conversations/${id}/messages`);
      const c = data.conversation;
      if (c.customer.id === session.user.id) {
        setTitle(c.proUser.professional?.displayName || c.proUser.name || "Professional");
        setPhone(c.proUser.phone);
      } else {
        setTitle(c.customer.name || "Customer");
        setPhone(c.customer.phone);
      }
    })().catch(() => router.replace("/login"));
  }, [id, router]);

  if (!me) return <div className="mobile-shell p-6 text-sm text-stone-500">Opening chat…</div>;

  return (
    <div className="mobile-shell flex h-dvh flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button onClick={() => router.back()} className="text-sm font-semibold text-stone-600">
          Back
        </button>
        <h1 className="min-w-0 flex-1 truncate font-display text-2xl">{title}</h1>
        {phone ? (
          <a
            href={whatsappHref(phone, `Hi ${title}, messaging you from Zana.`)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
      <ChatThread conversationId={id} meId={me} />
    </div>
  );
}
