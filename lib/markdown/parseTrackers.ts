// Lightweight parser for IMPROVEMENTS.md / TODO.md.
//
// Convention:
//   ### {statusEmoji?} {N}. {title}    ← item header (### lvl-3)
//   …body lines (Markdown, multi-paragraph, anything)…
//   <!-- key: {uuid} -->                ← optional stable id; auto-assigned if missing
//
// Section headings (## …) set defaults for the items inside them:
//   ## 🔄 In Progress       → status=in_progress for items without their own status
//   ## High Priority        → priority=high  (and priority_group="High Priority" for todos)
//
// The parser preserves the raw body verbatim so rich structure (Context/Scope/Changes etc.)
// survives a round-trip. Status + priority can also be carried inline via `**Status:**` /
// `**Priority:**` lines, which take precedence over section defaults.

import type { ItemPriority, ItemStatus } from "@/lib/constants";

export type ParsedItem = {
  key: string | null;
  title: string;
  description: string;
  status: ItemStatus;
  priority: ItemPriority;
  priority_group: string | null;
  position: number;
  // True when the markdown explicitly carried this field (inline `**Status:** …`,
  // emoji prefix in the header, or section heading). False when it's just the
  // parser's fallback. Merge uses these to skip overwriting dashboard edits on
  // UPDATE so pushes without explicit markers don't clobber user changes.
  statusExplicit: boolean;
  priorityExplicit: boolean;
};

const STATUS_EMOJI_TO_STATUS: Record<string, ItemStatus> = {
  "🔲": "queued",
  "⬜": "queued",
  "🔄": "in_progress",
  "🔁": "in_progress",
  "✅": "done",
  "☑️": "done",
};

function detectStatusFromText(text: string): ItemStatus | null {
  for (const [emoji, status] of Object.entries(STATUS_EMOJI_TO_STATUS)) {
    if (text.includes(emoji)) return status;
  }
  const lower = text.toLowerCase();
  if (/\bin\s*progress\b/.test(lower)) return "in_progress";
  if (/\bdone\b|\bcompleted\b/.test(lower)) return "done";
  if (/\bqueued\b|\btodo\b|\bbacklog\b/.test(lower)) return "queued";
  return null;
}

function detectPriorityFromText(text: string): ItemPriority | null {
  const lower = text.toLowerCase();
  if (/\bhigh\b/.test(lower)) return "high";
  if (/\bmedium\b|\bmed\b/.test(lower)) return "medium";
  if (/\blow\b/.test(lower)) return "low";
  return null;
}

function normalizeTitle(raw: string): string {
  // Strip leading `~~` and trailing `~~ ✅`/`✅` (done-marker convention from TODO.md)
  let t = raw.trim();
  t = t.replace(/^~~+/, "");
  t = t.replace(/~~+\s*✅?$/u, "").trim();
  t = t.replace(/\s*✅\s*$/u, "").trim();
  return t;
}

const HEADER_RE = /^###\s+(.*)$/;
const ITEM_NUMBER_RE = /^([🔲⬜🔄🔁✅☑️]+\s*)?(?:\d+\.\s*)?(.*)$/u;
const KEY_RE = /<!--\s*key:\s*([A-Za-z0-9_-]+)\s*-->/;
const INLINE_STATUS_RE = /\*\*Status:\*\*\s*([A-Za-z _-]+)/i;
const INLINE_PRIORITY_RE = /\*\*Priority:\*\*\s*([A-Za-z _-]+)/i;

export function parseTrackerMarkdown(md: string): ParsedItem[] {
  if (!md.trim()) return [];

  const lines = md.split(/\r?\n/);
  const items: ParsedItem[] = [];

  let sectionStatus: ItemStatus | null = null;
  let sectionPriority: ItemPriority | null = null;
  let sectionLabel: string | null = null;

  type Pending = { headerText: string; bodyLines: string[] };
  let pending: Pending | null = null;

  function flush() {
    if (!pending) return;
    const { headerText, bodyLines } = pending;
    const body = bodyLines.join("\n").replace(/\s+$/, "");
    const keyMatch = body.match(KEY_RE);
    const key = keyMatch ? keyMatch[1] : null;
    const bodyClean = body.replace(KEY_RE, "").replace(/\n{3,}/g, "\n\n").trim();

    // Title (strip leading emoji + numbering)
    const m = headerText.match(ITEM_NUMBER_RE);
    const title = normalizeTitle(m ? m[2] : headerText);
    const headerStatus = detectStatusFromText(headerText);

    const inlineStatusRaw = bodyClean.match(INLINE_STATUS_RE)?.[1] ?? null;
    const inlinePriorityRaw = bodyClean.match(INLINE_PRIORITY_RE)?.[1] ?? null;
    const inlineStatus = inlineStatusRaw ? detectStatusFromText(inlineStatusRaw) : null;
    const inlinePriority = inlinePriorityRaw
      ? detectPriorityFromText(inlinePriorityRaw)
      : null;

    const statusSignal = inlineStatus ?? headerStatus ?? sectionStatus;
    const prioritySignal = inlinePriority ?? sectionPriority;
    const status: ItemStatus = statusSignal ?? "queued";
    const priority: ItemPriority = prioritySignal ?? "medium";

    items.push({
      key,
      title,
      description: bodyClean || "",
      status,
      priority,
      priority_group: sectionLabel,
      position: items.length,
      statusExplicit: statusSignal !== null,
      priorityExplicit: prioritySignal !== null,
    });
    pending = null;
  }

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      flush();
      const heading = line.slice(3).trim();
      const s = detectStatusFromText(heading);
      const p = detectPriorityFromText(heading);
      if (s) sectionStatus = s;
      if (p) {
        sectionPriority = p;
        sectionLabel = heading; // freeform label for todos.priority_group
      } else {
        // Section that isn't a status/priority header — keep current defaults.
      }
      continue;
    }
    if (line.startsWith("# ")) {
      // Doc title; reset section context
      flush();
      sectionStatus = null;
      sectionPriority = null;
      sectionLabel = null;
      continue;
    }
    const headerMatch = line.match(HEADER_RE);
    if (headerMatch) {
      flush();
      pending = { headerText: headerMatch[1].trim(), bodyLines: [] };
      continue;
    }
    if (pending) pending.bodyLines.push(line);
  }
  flush();
  return items;
}
