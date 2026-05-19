// Server-safe helper for the `?app=` query param. Kept out of AppTabs.tsx
// because that file is "use client" — exporting a plain function from a client
// module wraps it in a client-reference proxy, breaking calls from server
// components.

import { isAppSlug, type AppSlug } from "@/lib/constants";

export type AppFilter = AppSlug | "all";

export function readAppFilter(value: string | undefined | null): AppFilter {
  if (value === "all") return "all";
  if (isAppSlug(value)) return value;
  return "all";
}
