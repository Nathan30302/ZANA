"use client";

import { Button, Input, LogoMark } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({
  intendedRole = "CUSTOMER",
  redirectTo,
}: {
  intendedRole?: "CUSTOMER" | "PROFESSIONAL" | "ADMIN";
  redirectTo: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api<{ devCode?: string }>("/api/auth/otp/request", {
        method: "POST",
        json: { phone },
      });
      setDevCode(res.devCode);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/otp/verify", {
        method: "POST",
        json: { phone, code, name: name || undefined, role: intendedRole },
      });
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-6 py-10">
      <div className="animate-fade-up space-y-8">
        <div className="text-center">
          <LogoMark size={76} className="mx-auto" />
          <h1 className="font-display mt-5 text-4xl text-stone-900">Welcome to Zana</h1>
          <p className="mt-2 text-sm text-stone-500">Beauty on your fingertips</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={requestOtp} className="space-y-3">
            {intendedRole !== "ADMIN" ? (
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : null}
            <Input
              placeholder="Phone (+260…)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Continue with OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <p className="text-sm text-stone-500">
              Enter the code sent to <span className="font-medium text-stone-800">{phone}</span>
            </p>
            {devCode ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                Demo OTP: <strong>{devCode}</strong>
              </div>
            ) : null}
            <Input
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying…" : "Verify & enter"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>
              Change number
            </Button>
          </form>
        )}

        {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
