// Outbound: regenerate IMPROVEMENTS.md / TODO.md from DB and commit to each repo.
//
// Safety guard: refuse to write for an app that has NEVER had an inbound sync
// (no rows with last_synced_at). This avoids clobbering a rich, hand-authored
// IMPROVEMENTS.md with a sparse dashboard-only view on the first run. The user
// must do at least one `git push` of the MD file (or hit /api/admin/sync/inbound
// manually) before outbound will write for that app.

import type { AppSlug } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import {
  serializeImprovements,
  serializeTodos,
  type SerializableItem,
} from "@/lib/markdown/serializeTrackers";
import { APP_REPO, ghPutFile } from "./github";

export type OutboundResult = {
  app: AppSlug;
  skipped?: "no_inbound_seed" | "force_disabled";
  improvements?: { changed: boolean };
  todos?: { changed: boolean };
};

async function hasBeenSynced(app: AppSlug): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const [a, b] = await Promise.all([
    supabase
      .from("improvements")
      .select("id", { count: "exact", head: true })
      .eq("app", app)
      .not("last_synced_at", "is", null),
    supabase
      .from("todos")
      .select("id", { count: "exact", head: true })
      .eq("app", app)
      .not("last_synced_at", "is", null),
  ]);
  return (a.count ?? 0) > 0 || (b.count ?? 0) > 0;
}

async function loadItems(
  resource: "improvements" | "todos",
  app: AppSlug,
): Promise<SerializableItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(resource)
    .select("title,description,status,priority,priority_group,external_key,created_at")
    .eq("app", app)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SerializableItem[];
}

export async function pushOutboundForApp(
  app: AppSlug,
  opts: { force?: boolean } = {},
): Promise<OutboundResult> {
  if (!opts.force && !(await hasBeenSynced(app))) {
    return { app, skipped: "no_inbound_seed" };
  }
  const repo = APP_REPO[app];

  const improvements = await loadItems("improvements", app);
  const todos = await loadItems("todos", app);
  const improvementsMd = serializeImprovements(improvements);
  const todosMd = serializeTodos(todos);

  const ts = new Date().toISOString();
  const message = `chore(trackers): sync from /manage @ ${ts}`;

  const [impChanged, todoChanged] = await Promise.all([
    ghPutFile(repo.owner, repo.repo, "IMPROVEMENTS.md", improvementsMd, message),
    ghPutFile(repo.owner, repo.repo, "TODO.md", todosMd, message),
  ]);

  return {
    app,
    improvements: { changed: impChanged },
    todos: { changed: todoChanged },
  };
}
