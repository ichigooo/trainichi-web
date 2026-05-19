// Serialize DB rows into IMPROVEMENTS.md / TODO.md.
//
// Output groups by status (In Progress → Queued → Done), within each group sorted
// by priority (high first) then created_at. Each item gets a stable
// `<!-- key: {external_key} -->` HTML comment so the round-trip parser can match.
//
// The original parsed body is preserved verbatim — we don't reformat or strip
// inline Status/Priority lines — so rich Markdown structure survives a write-back.

import type { ItemPriority, ItemStatus } from "@/lib/constants";

export type SerializableItem = {
  external_key: string | null;
  title: string;
  description: string | null;
  status: ItemStatus;
  priority: ItemPriority;
  priority_group?: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  in_progress: "🔄 In Progress",
  queued: "🔲 Queued",
  done: "✅ Done",
};

const STATUS_EMOJI: Record<ItemStatus, string> = {
  in_progress: "🔄",
  queued: "🔲",
  done: "✅",
};

const PRIORITY_RANK: Record<ItemPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const STATUS_ORDER: ItemStatus[] = ["in_progress", "queued", "done"];

export function serializeImprovements(items: SerializableItem[]): string {
  return renderDoc({
    title: "Improvements",
    intro:
      "Broader improvement tasks — features, branding, infra, polish. " +
      "Synced to/from https://www.trainichi.app/manage/improvements.\n\n" +
      "**Status legend:** 🔲 Queued · 🔄 In Progress · ✅ Done",
    items,
    includePriorityGroup: false,
  });
}

export function serializeTodos(items: SerializableItem[]): string {
  return renderDoc({
    title: "UI Todos",
    intro:
      "Small UI polish + design audit items. " +
      "Synced to/from https://www.trainichi.app/manage/todos.\n\n" +
      "**Status legend:** 🔲 Queued · 🔄 In Progress · ✅ Done",
    items,
    includePriorityGroup: true,
  });
}

function renderDoc(opts: {
  title: string;
  intro: string;
  items: SerializableItem[];
  includePriorityGroup: boolean;
}): string {
  const out: string[] = [];
  out.push(`# ${opts.title}`);
  out.push("");
  out.push(opts.intro);
  out.push("");
  out.push("---");
  out.push("");

  let counter = 0;
  for (const status of STATUS_ORDER) {
    const group = opts.items
      .filter((it) => it.status === status)
      .sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          +new Date(a.created_at) - +new Date(b.created_at),
      );
    if (group.length === 0) continue;
    out.push(`## ${STATUS_LABEL[status]}`);
    out.push("");
    for (const item of group) {
      counter += 1;
      out.push(`### ${STATUS_EMOJI[status]} ${counter}. ${item.title}`);
      const meta: string[] = [`**Priority:** ${item.priority}`];
      if (opts.includePriorityGroup && item.priority_group) {
        meta.push(`**Group:** ${item.priority_group}`);
      }
      out.push(meta.join(" · "));
      const body = (item.description ?? "").trim();
      if (body) {
        out.push("");
        out.push(body);
      }
      if (item.external_key) {
        out.push("");
        out.push(`<!-- key: ${item.external_key} -->`);
      }
      out.push("");
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
