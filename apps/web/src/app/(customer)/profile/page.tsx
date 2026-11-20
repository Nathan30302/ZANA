"use client";

import { Button, Card, EmptyState, Input } from "@/components/ui";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [favorites, setFavorites] = useState<{ id: string; displayName: string }[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ user: User | null }>("/api/auth/me").then((d) => {
      setUser(d.user);
      setName(d.user?.name || "");
      setEmail(d.user?.email || "");
    });
    api<{ favorites: { id: string; displayName: string }[] }>("/api/favorites")
      .then((d) => setFavorites(d.favorites))
      .catch(() => setFavorites([]));
  }, []);

  async function save() {
    const data = await api<{ user: User }>("/api/auth/me", {
      method: "PATCH",
      json: { name, email },
    });
    setUser(data.user);
    setMsg("Saved");
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="space-y-4 px-4 pt-8">
        <EmptyState title="You’re signed out" body="Log in to manage your profile and favorites." />
        <Link href="/login">
          <Button className="w-full">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-800 text-xl font-semibold text-white">
          {(user.name || user.phone).slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl text-stone-900">{user.name || "Your profile"}</h1>
          <p className="mt-1 text-sm text-stone-500">{user.phone}</p>
        </div>
      </div>
      <Card className="space-y-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
        <Button onClick={save} className="w-full">
          Save changes
        </Button>
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      </Card>

      <Card className="space-y-2">
        <div className="font-semibold">Favorites</div>
        {favorites.length === 0 ? (
          <p className="text-sm text-stone-500">Tap the heart on a pro to keep them here.</p>
        ) : (
          favorites.map((f) => (
            <Link
              key={f.id}
              href={`/pros/${f.id}`}
              className="flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-900"
            >
              <span className="truncate">{f.displayName}</span>
              <span className="text-rose-800">View</span>
            </Link>
          ))
        )}
      </Card>

      <Card className="space-y-2 text-sm text-stone-600">
        <div className="font-semibold text-stone-900">How you pay</div>
        <p>You pay the stylist directly, in cash or mobile money, when the visit is done. Zana does not charge your phone.</p>
      </Card>

      <Card className="space-y-2 text-sm">
        <Link href="/messages" className="block font-semibold text-rose-800">
          Messages
        </Link>
        <Link href="/pro/login" className="block font-semibold text-rose-800">
          Switch to Professional app →
        </Link>
        <Link href="/admin/login" className="block text-stone-500">
          Admin panel
        </Link>
      </Card>

      <Button variant="secondary" className="w-full" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
