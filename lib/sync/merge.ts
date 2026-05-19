// Apply an inbound MD payload (just parsed from IMPROVEMENTS.md / TODO.md) to a
// per-app table (`improvements` or `todos`).
//
// Strategy:
// - Items in the MD payload with an existing `external_key` → UPDATE the matching DB row.
// - Items without an `external_key` → INSERT a new row with a freshly generated UUID;
//   the next outbound write-back will populate the key in the MD file.
// - DB rows that DON'T appear in the inbound payload are LEFT IN PLACE — they may have
//   been created in the dashboard between pushes and will be emitted on the next outbound.
//
// Conflict resolution: an inbound push always wins for the fields it carries. This is
// appropriate for single-user, infrequent-conflict use. We bump `last_synced_at` on each
// touched row so the cron outbound knows what changed.

import { getSupabaseAdmin } from "@/lib/supabaseServer";
import type { ParsedItem } from "@/lib/markdown/parseTrackers";
import type { AppSlug } from "@/lib/constants";

export type SyncResource = "improvements" | "todos";

export type SyncResult = {
  inserted: number;
  updated: number;
  skipped: number;
};

export async function applyInboundTrackers(
  resource: SyncResource,
  app: AppSlug,
  items: ParsedItem[],
): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Load existing keys for this app so we can route insert vs update.
  const { data: existing, error: loadErr } = await supabase
    .from(resource)
    .select("id, external_key")
    .eq("app", app)
    .not("external_key", "is", null);
  if (loadErr) throw new Error(loadErr.message);

  const keyToId = new Map<string, string>();
  for (const row of existing ?? []) {
    if (row.external_key) keyToId.set(row.external_key, row.id);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.title.trim()) {
      skipped++;
      continue;
    }

    const base: Record<string, unknown> = {
      app,
      title: item.title.slice(0, 300),
      description: item.description ? item.description.slice(0, 10000) : null,
      status: item.status,
      priority: item.priority,
      last_synced_at: now,
    };
    if (resource === "todos") {
      base.priority_group = item.priority_group ?? null;
    }

    if (item.key && keyToId.has(item.key)) {
      const id = keyToId.get(item.key)!;
      const { error } = await supabase.from(resource).update(base).eq("id", id);
      if (error) throw new Error(error.message);
      updated++;
    } else {
      // Generate a stable key when MD didn't carry one; the next outbound
      // writes it back into the file.
      const external_key = item.key ?? crypto.randomUUID();
      const { error } = await supabase
        .from(resource)
        .insert({ ...base, external_key });
      if (error) throw new Error(error.message);
      inserted++;
    }
  }

  return { inserted, updated, skipped };
}
