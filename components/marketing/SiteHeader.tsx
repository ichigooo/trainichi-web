import Link from "next/link";
import { TESTFLIGHT_URL } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="border-b border-cream-border bg-cream-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-sans text-2xl font-semibold tracking-tight text-cream-ink"
        >
          Aretē
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/feedback"
            className="text-sm text-cream-ink-secondary transition hover:text-cream-ink"
          >
            Feedback
          </Link>
          <a
            href={TESTFLIGHT_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-cream-accent px-4 py-2 text-sm font-semibold text-cream-ink transition hover:bg-cream-accent-hover"
          >
            Join TestFlight
          </a>
        </div>
      </div>
    </header>
  );
}
