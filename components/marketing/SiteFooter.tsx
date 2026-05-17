import Link from "next/link";
import { TESTFLIGHT_URL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-cream-border bg-cream-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-sans text-xl font-semibold tracking-tight text-cream-ink">
            Aretē
          </p>
          <p className="mt-1 text-sm text-cream-ink-tertiary">
            Strength &amp; climbing training for women.
          </p>
        </div>
        <nav className="flex gap-6 text-sm text-cream-ink-secondary">
          <a
            href={TESTFLIGHT_URL}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-cream-ink"
          >
            TestFlight
          </a>
          <Link href="/feedback" className="transition hover:text-cream-ink">
            Feedback
          </Link>
        </nav>
      </div>
      <div className="border-t border-cream-border">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-cream-ink-tertiary">
          © {new Date().getFullYear()} Aretē — formerly Trainichi.
        </p>
      </div>
    </footer>
  );
}
