"use client";

import { ChatThread } from "@/components/chat-thread";
import { api } from "@/lib/api-client";
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
    <div className="mobile-shell px-4 py-5">
      <button onClick={() => router.back()} className="mb-3 text-sm font-semibold text-stone-600">
        Back
      </button>
      <ChatThread conversationId={id} meId={me} title={title} phone={phone} />
    </div>
  );
}
