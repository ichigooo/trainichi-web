import Image from "next/image";
import Link from "next/link";
import { TESTFLIGHT_URL } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden">
      {/* The only place photography is allowed — kept low-opacity behind copy. */}
      <div className="absolute inset-0 -z-10 opacity-[0.12]">
        <Image
          src="/homebg.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
        <p className="inline-flex items-center rounded-full border border-cream-border bg-cream-surface px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-cream-ink-secondary">
          Now on iOS TestFlight
        </p>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.08] text-cream-ink md:text-6xl">
          The workouts you save, turned into a real plan.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-ink-secondary">
          Strength and climbing training that schedules, tracks, and progresses
          — not a dead bookmark.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <a
            href={TESTFLIGHT_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-cream-accent px-6 py-3 font-semibold text-cream-ink transition hover:bg-cream-accent-hover"
          >
            Join the TestFlight
          </a>
          <Link
            href="/feedback"
            className="font-medium text-cream-link underline-offset-4 transition hover:underline"
          >
            Share feedback →
          </Link>
        </div>
      </div>
    </section>
  );
}
