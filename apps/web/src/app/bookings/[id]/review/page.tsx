"use client";

import { Button, Card, TextArea } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/reviews", {
        method: "POST",
        json: { bookingId: id, rating, comment },
      });
      router.replace(`/bookings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mobile-shell px-4 py-8">
      <h1 className="font-display text-3xl">Rate your service</h1>
      <p className="mt-2 text-sm text-stone-500">Help others find quality beauty pros on Zana.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Card>
          <div className="flex justify-center gap-2 text-3xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? "text-amber-500" : "text-stone-300"}>
                ★
              </button>
            ))}
          </div>
        </Card>
        <TextArea
          rows={4}
          placeholder="What did you love?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Submitting…" : "Submit review"}
        </Button>
      </form>
    </div>
  );
}
