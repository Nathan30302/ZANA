import { LogoMark } from "@/components/ui";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#fffaf8]">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <div className="font-display text-xl">Zana Admin</div>
              <div className="text-xs text-stone-500">Platform control</div>
            </div>
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-stone-600">
            <Link href="/admin">Overview</Link>
            <Link href="/admin/applications">Applications</Link>
            <Link href="/admin/settings">Commission</Link>
            <Link href="/">Customer app</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
