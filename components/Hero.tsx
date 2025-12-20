"use client";

import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <div className="absolute inset-0 opacity-40">
        <Image src="/homebg.png" alt="Trainichi background" fill priority className="object-cover mix-blend-soft-light" />
      </div>
      <div className="absolute -top-32 left-12 h-96 w-56 rotate-12 bg-white/10 blur-3xl" />
      <div className="absolute top-0 right-32 h-[32rem] w-72 -rotate-6 bg-trainichi-gold/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-64 rotate-3 bg-emerald-500/10 blur-2xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-20 md:px-12">
        <div className="flex items-center justify-between text-sm text-white/70">
          <div className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em]">
            Trainichi
          </div>
          <nav className="hidden gap-8 text-xs uppercase tracking-[0.3em] text-white/70 md:flex">
            <Link href="#about">About</Link>
            <span className="opacity-40">Journal</span>
            <span className="opacity-40">Library</span>
          </nav>
          <Link
            href="#"
            className="rounded-full border border-trainichi-gold/60 bg-trainichi-gold/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-trainichi-gold"
          >
            Join TestFlight
          </Link>
        </div>

        <div className="mt-32 max-w-3xl text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs tracking-[0.3em] text-white/70">
            NEW • iOS TestFlight
          </div>
          <p className="font-serif text-5xl italic leading-tight text-trainichi-gold md:text-7xl">
            Training for dreamers, climbers, and relentless creators.
          </p>
          <p className="mt-6 max-w-2xl font-sans text-base text-white/70">
            Trainichi blends mindful programming with cinematic design so every session feels like a
            story. Dial in custom plans, explore guided progressions, and see your performance through
            immersive visuals.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="#about"
              className="rounded-full bg-trainichi-gold px-6 py-3 font-semibold text-black transition hover:bg-trainichi-gold/90"
            >
              Explore Trainichi
            </Link>
            <Link href="#" className="text-white/80 underline-offset-4 transition hover:text-white">
              Download the deck →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
