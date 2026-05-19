import type { Metadata } from "next";
import { ManageNav } from "@/components/manage/ManageNav";

export const metadata: Metadata = {
  title: "Owner dashboard — Aretē",
  robots: { index: false, follow: false },
};

// ManageNav uses useSearchParams (to preserve ?app= across section tabs).
// Force the whole dashboard dynamic so Next doesn't try to prerender it.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <ManageNav />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
