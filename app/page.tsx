import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Hero />
      <AboutSection />
    </main>
  );
}
