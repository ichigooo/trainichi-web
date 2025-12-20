export function AboutSection() {
  return (
    <section id="about" className="bg-black px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-trainichi-gold">About</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">
            Trainichi is a training ritual designed for athletes who chase artful progress.
          </h2>
          <p className="mt-6 text-base text-white/80">
            We craft cinematic planning tools, mindful strength prompts, and a platform where your
            workouts feel alive. Expect data storytelling, personalized routines, and a coach that slots
            beside you like a climbing partner.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Current focus</p>
            <h3 className="mt-3 font-serif text-2xl">About</h3>
            <p className="mt-4 text-sm text-white/70">
              We are finishing our manifesto and sharing the philosophy behind every Trainichi cycle.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Coming soon</p>
            <h3 className="mt-3 font-serif text-2xl">Library</h3>
            <p className="mt-4 text-sm text-white/70">
              Movement scripts, guided breath, and modular workouts drop later this season.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
