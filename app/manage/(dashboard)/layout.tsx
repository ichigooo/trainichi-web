import type { Metadata } from "next";
import { ManageNav } from "@/components/manage/ManageNav";

export const metadata: Metadata = {
  title: "Owner dashboard — Aretē",
  robots: { index: false, follow: false },
};

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
