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

    // Always-synced fields. Status/priority handling depends on whether the
    // markdown carried an explicit marker — see below.
    const titleBody: Record<string, unknown> = {
      app,
      title: item.title.slice(0, 300),
      description: item.description ? item.description.slice(0, 10000) : null,
      last_synced_at: now,
    };
    if (resource === "todos") {
      titleBody.priority_group = item.priority_group ?? null;
    }

    if (item.key && keyToId.has(item.key)) {
      // UPDATE path: only overwrite status/priority when the markdown
      // explicitly carried one. Otherwise dashboard edits to these fields
      // would be wiped on every push.
      const id = keyToId.get(item.key)!;
      const patch: Record<string, unknown> = { ...titleBody };
      if (item.statusExplicit) patch.status = item.status;
      if (item.priorityExplicit) patch.priority = item.priority;
      const { error } = await supabase.from(resource).update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      updated++;
    } else {
      // INSERT path: seed status/priority with whatever the parser produced
      // (explicit or default) so new rows always have a value.
      const external_key = item.key ?? crypto.randomUUID();
      const { error } = await supabase
        .from(resource)
        .insert({
          ...titleBody,
          status: item.status,
          priority: item.priority,
          external_key,
        });
      if (error) throw new Error(error.message);
      inserted++;
    }
  }

  return { inserted, updated, skipped };
}
