"use client";

import { Button, Input } from "@/components/ui";
import { api } from "@/lib/api-client";
import { whatsappHref } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

type Message = { id: string; senderId: string; body: string; createdAt: string };

export function ChatThread({
  conversationId,
  meId,
  title,
  phone,
}: {
  conversationId: string;
  meId: string;
  title: string;
  phone?: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await api<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`);
    setMessages(data.messages);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 3000);
    return () => clearInterval(t);
  }, [conversationId]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        json: { body: text.trim() },
      });
      setText("");
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">{title}</h1>
        {phone ? (
          <a
            href={whatsappHref(phone, `Hi ${title}, messaging you from Zana.`)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-3xl bg-white p-3 ring-1 ring-stone-100">
        {messages.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-stone-500">
            Say hello. You can also continue on WhatsApp.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-rose-800 text-white" : "bg-stone-100 text-stone-800"
                  }`}
                >
                  <div>{m.body}</div>
                  <div className={`mt-1 text-[10px] ${mine ? "text-rose-100" : "text-stone-400"}`}>
                    {format(new Date(m.createdAt), "HH:mm")}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" />
        <Button type="submit" disabled={sending} className="shrink-0">
          Send
        </Button>
      </form>
    </div>
  );
}
