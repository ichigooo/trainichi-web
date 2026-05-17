import type { Metadata } from "next";
import { LoginForm } from "@/components/manage/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Aretē owner dashboard",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-bg px-6">
      <div className="w-full max-w-sm">
        <p className="font-sans text-3xl font-semibold tracking-tight text-cream-ink">
          Aretē
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-cream-ink-tertiary">
          Owner dashboard
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
