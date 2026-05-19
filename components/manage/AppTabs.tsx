"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { APPS, APP_LABELS } from "@/lib/constants";
import type { AppFilter } from "@/lib/appFilter";

const TABS: { value: AppFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...APPS.map((slug) => ({ value: slug as AppFilter, label: APP_LABELS[slug] })),
];

export function AppTabs({ current }: { current: AppFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(value: AppFilter) {
    if (value === current) return;
    const sp = new URLSearchParams(params.toString());
    if (value === "all") sp.delete("app");
    else sp.set("app", value);
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-5 flex flex-wrap gap-1 rounded-md border border-cream-border bg-cream-surface p-1">
      {TABS.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            onClick={() => select(tab.value)}
            className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-cream-accent text-cream-ink"
                : "text-cream-ink-secondary hover:bg-cream-bg-secondary"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
