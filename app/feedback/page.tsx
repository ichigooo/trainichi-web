import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export const metadata: Metadata = {
  title: "Feedback — Aretē",
  description: "Tell us what's broken or what you wish Aretē did.",
};

export default function FeedbackPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cream-accent-pressed">
          Feedback
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-cream-ink">
          Tell us what you think
        </h1>
        <p className="mt-3 text-cream-ink-secondary">
          Found a bug? Wish Aretē did something it doesn&apos;t yet? We read
          every note — it shapes what we build next.
        </p>
        <div className="mt-8">
          <FeedbackForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
