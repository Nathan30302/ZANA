"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/zana-logo.png"
      alt="Zana"
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}

export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={44} />
      <div>
        <div className="font-display text-2xl font-semibold tracking-tight text-stone-900">Zana</div>
        {subtitle ? <div className="text-xs text-stone-500">{subtitle}</div> : null}
      </div>
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-rose-800 text-white hover:bg-rose-900 shadow-sm shadow-rose-900/10 disabled:bg-rose-300",
    secondary:
      "bg-white text-stone-900 border border-stone-200 hover:bg-stone-50 disabled:opacity-50",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99]",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-rose-800/20 placeholder:text-stone-400 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-rose-800/20 placeholder:text-stone-400 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition",
        active
          ? "bg-rose-800 text-white"
          : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-rose-50",
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "rose",
}: {
  children: ReactNode;
  tone?: "rose" | "orange" | "stone" | "green";
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-800",
    orange: "bg-orange-50 text-orange-700",
    stone: "bg-stone-100 text-stone-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const cls = cn(
    "rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(28,25,23,0.05)] ring-1 ring-stone-100 transition active:scale-[0.995]",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-display text-xl text-stone-900">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-200 bg-white/70 px-5 py-10 text-center">
      <div className="font-display text-lg text-stone-900">{title}</div>
      <p className="mt-2 text-sm text-stone-500">{body}</p>
    </div>
  );
}

export function StarRow({ rating, light = false }: { rating: number; light?: boolean }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", light ? "text-white" : "text-stone-900")}>
      <span aria-hidden className="tracking-tight text-amber-400">
        {"★★★★★".slice(0, full)}
        <span className={light ? "text-white/35" : "text-stone-300"}>{"★★★★★".slice(full)}</span>
      </span>
      {rating.toFixed(1)}
    </span>
  );
}
