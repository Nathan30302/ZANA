import { BottomNav } from "@/components/bottom-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell">
      <div className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav variant="customer" />
    </div>
  );
}
