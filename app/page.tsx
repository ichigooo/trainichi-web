import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Hero } from "@/components/marketing/Hero";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col bg-cream-bg text-cream-ink">
        <Hero />
      </main>
      <SiteFooter />
    </div>
  );
}
