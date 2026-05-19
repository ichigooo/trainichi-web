"use client";

import { useState } from "react";
import { APP_LABELS, type AppSlug } from "@/lib/constants";
import type { AppFilter } from "@/lib/appFilter";

/**
 * Calls /api/admin/sync/outbound to regenerate IMPROVEMENTS.md + TODO.md in
 * the selected app's GitHub repo from the dashboard's current state.
 * Disabled in the "all" view — outbound is per-app.
 */
export function PushToRepoButton({ app }: { app: AppFilter }) {
  const [pushing, setPushing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPush = app !== "all";

  async function push() {
    if (!canPush) return;
    setPushing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/sync/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: app as AppSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");
      if (data.skipped === "no_inbound_seed") {
        setMessage(
          `Skipped: ${APP_LABELS[app as AppSlug]} hasn't received an inbound push yet. ` +
            "Push IMPROVEMENTS.md/TODO.md from the repo first to seed the dashboard.",
        );
      } else {
        const parts: string[] = [];
        if (data.improvements?.changed) parts.push("IMPROVEMENTS.md");
        if (data.todos?.changed) parts.push("TODO.md");
        setMessage(
          parts.length === 0
            ? "No changes — files already up to date."
            : `Committed ${parts.join(" + ")} to ${APP_LABELS[app as AppSlug]}.`,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={push}
        disabled={!canPush || pushing}
        title={
          canPush
            ? `Regenerate ${APP_LABELS[app as AppSlug]}'s IMPROVEMENTS.md + TODO.md from dashboard`
            : "Select an app to push to its repo"
        }
        className="rounded-md border border-cream-border bg-cream-surface px-3 py-1.5 text-sm font-medium text-cream-ink-secondary transition hover:bg-cream-bg-secondary disabled:opacity-50"
      >
        {pushing ? "Pushing…" : "Push to repo"}
      </button>
      {message && (
        <span className="text-xs text-cream-ink-secondary">{message}</span>
      )}
      {error && (
        <span className="text-xs text-cream-error">{error}</span>
      )}
    </div>
  );
}
