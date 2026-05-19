"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  APPS,
  APP_LABELS,
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  type AppSlug,
  type ItemPriority,
  type ItemStatus,
} from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { AppFilter } from "@/lib/appFilter";

export type BoardItem = {
  id: string;
  app: AppSlug;
  title: string;
  description: string | null;
  status: ItemStatus;
  priority: ItemPriority;
  priority_group?: string | null;
  created_at: string;
  updated_at: string;
};

const PRIORITY_RANK: Record<ItemPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
const STATUS_ORDER: ItemStatus[] = ["in_progress", "queued", "done"];
const STATUS_LABEL: Record<ItemStatus, string> = {
  queued: "Queued",
  in_progress: "In progress",
  done: "Done",
};

type SortKey = "priority" | "reported" | "updated" | "created" | "title";
const SORT_LABEL: Record<SortKey, string> = {
  priority: "Priority",
  reported: "TF feedback (newest)",
  updated: "Recently updated",
  created: "Recently added",
  title: "Title A→Z",
};
const SORT_KEYS: SortKey[] = ["priority", "reported", "updated", "created", "title"];

// Pulls the latest `— YYYY-MM-DD` (or `- YYYY-MM-DD`) date out of the description.
// Used to sort by when a TestFlight tester reported the underlying feedback,
// which is embedded inline in blockquotes when items come from the ASC sync.
const FEEDBACK_DATE_RE = /[—-]\s*(\d{4}-\d{2}-\d{2})\b/g;
function latestFeedbackDate(description: string | null): number | null {
  if (!description) return null;
  let best = -Infinity;
  const re = new RegExp(FEEDBACK_DATE_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(description)) !== null) {
    const t = Date.parse(m[1]);
    if (!Number.isNaN(t) && t > best) best = t;
  }
  return best === -Infinity ? null : best;
}

function sortItems(items: BoardItem[], sortKey: SortKey): BoardItem[] {
  const copy = [...items];
  switch (sortKey) {
    case "priority":
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          +new Date(b.updated_at) - +new Date(a.updated_at),
      );
    case "reported":
      return copy.sort((a, b) => {
        const da = latestFeedbackDate(a.description);
        const db = latestFeedbackDate(b.description);
        // Items with a parseable feedback date come first (newest), then items
        // without a date fall back to created_at desc.
        if (da !== null && db !== null) return db - da;
        if (da !== null) return -1;
        if (db !== null) return 1;
        return +new Date(b.created_at) - +new Date(a.created_at);
      });
    case "updated":
      return copy.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    case "created":
      return copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

const inputClass =
  "w-full rounded-[10px] border border-cream-border bg-cream-surface px-3 py-2 text-sm text-cream-ink outline-none transition focus:border-cream-accent-pressed";

export function ItemBoard({
  resource,
  initialItems,
  showPriorityGroup,
  app,
}: {
  resource: "improvements" | "todos";
  initialItems: BoardItem[];
  showPriorityGroup: boolean;
  app: AppFilter;
}) {
  const [items, setItems] = useState<BoardItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("reported");
  const [groupByStatus, setGroupByStatus] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ItemPriority>("medium");
  const [priorityGroup, setPriorityGroup] = useState("");
  // When viewing "All", the create form must explicitly pick an app.
  const [createApp, setCreateApp] = useState<AppSlug>(
    app === "all" ? "workout" : app,
  );
  const [creating, setCreating] = useState(false);

  const showAppBadge = app === "all";

  async function api(path: string, method: string, body?: unknown) {
    const res = await fetch(`/api/admin/${resource}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const targetApp: AppSlug = app === "all" ? createApp : app;
      const payload: Record<string, unknown> = {
        app: targetApp,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      };
      if (showPriorityGroup) {
        payload.priority_group = priorityGroup.trim() || null;
      }
      const { item } = await api("", "POST", payload);
      setItems((prev) => [item, ...prev]);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setPriorityGroup("");
    } catch (err) {
      setError((err as Error).message);
    }
    setCreating(false);
  }

  async function handleUpdate(id: string, patch: Partial<BoardItem>) {
    setError(null);
    const prev = items;
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      const { item } = await api(`/${id}`, "PATCH", patch);
      setItems((p) => p.map((it) => (it.id === id ? item : it)));
    } catch (err) {
      setError((err as Error).message);
      setItems(prev);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== id));
    try {
      await api(`/${id}`, "DELETE");
    } catch (err) {
      setError((err as Error).message);
      setItems(prev);
    }
  }

  const sorted = sortItems(items, sortKey);

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-card border border-cream-border bg-cream-surface p-4 shadow-subtle"
      >
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              app === "all"
                ? "New item title…"
                : `New ${APP_LABELS[app]} item title…`
            }
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={inputClass}
          />
          <div className="flex flex-wrap items-center gap-3">
            {app === "all" && (
              <select
                value={createApp}
                onChange={(e) => setCreateApp(e.target.value as AppSlug)}
                className="rounded-[10px] border border-cream-border bg-cream-surface px-2 py-2 text-sm text-cream-ink outline-none"
              >
                {APPS.map((slug) => (
                  <option key={slug} value={slug}>
                    {APP_LABELS[slug]}
                  </option>
                ))}
              </select>
            )}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ItemPriority)}
              className="rounded-[10px] border border-cream-border bg-cream-surface px-2 py-2 text-sm text-cream-ink outline-none"
            >
              {ITEM_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)} priority
                </option>
              ))}
            </select>
            {showPriorityGroup && (
              <input
                value={priorityGroup}
                onChange={(e) => setPriorityGroup(e.target.value)}
                placeholder="Group (e.g. High Priority)"
                className="flex-1 min-w-[12rem] rounded-[10px] border border-cream-border bg-cream-surface px-3 py-2 text-sm text-cream-ink outline-none transition focus:border-cream-accent-pressed"
              />
            )}
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="ml-auto rounded-md bg-cream-accent px-4 py-2 text-sm font-semibold text-cream-ink transition hover:bg-cream-accent-hover disabled:opacity-50"
            >
              {creating ? "Adding…" : "Add item"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-cream-ink-secondary">
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.12em] text-cream-ink-tertiary">
            Sort by
          </span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-cream-border bg-cream-surface px-2 py-1 text-sm text-cream-ink outline-none focus:border-cream-accent-pressed"
          >
            {SORT_KEYS.map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={groupByStatus}
            onChange={(e) => setGroupByStatus(e.target.checked)}
            className="accent-cream-accent-pressed"
          />
          <span>Group by status</span>
        </label>
        <span className="ml-auto text-xs text-cream-ink-tertiary">
          {sorted.length} item{sorted.length === 1 ? "" : "s"}
        </span>
      </div>

      {groupByStatus ? (
        STATUS_ORDER.map((status) => {
          const group = sorted.filter((it) => it.status === status);
          return (
            <section key={status}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-cream-ink-tertiary">
                {STATUS_LABEL[status]}{" "}
                <span className="text-cream-ink-tertiary/70">
                  ({group.length})
                </span>
              </h2>
              {group.length === 0 ? (
                <p className="text-sm text-cream-ink-tertiary">Nothing here.</p>
              ) : (
                <ul className="space-y-2">
                  {group.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      showPriorityGroup={showPriorityGroup}
                      showAppBadge={showAppBadge}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })
      ) : (
        <ul className="space-y-2">
          {sorted.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              showPriorityGroup={showPriorityGroup}
              showAppBadge={showAppBadge}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({
  item,
  showPriorityGroup,
  showAppBadge,
  onUpdate,
  onDelete,
}: {
  item: BoardItem;
  showPriorityGroup: boolean;
  showAppBadge: boolean;
  onUpdate: (id: string, patch: Partial<BoardItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [priorityGroup, setPriorityGroup] = useState(
    item.priority_group ?? "",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    if (!title.trim()) return;
    const patch: Partial<BoardItem> = {
      title: title.trim(),
      description: description.trim() || null,
    };
    if (showPriorityGroup) {
      patch.priority_group = priorityGroup.trim() || null;
    }
    onUpdate(item.id, patch);
    setEditing(false);
  }

  function cancel() {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setPriorityGroup(item.priority_group ?? "");
    setEditing(false);
  }

  return (
    <li className="rounded-card border border-cream-border bg-cream-surface p-4 shadow-subtle">
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className={inputClass}
          />
          {showPriorityGroup && (
            <input
              value={priorityGroup}
              onChange={(e) => setPriorityGroup(e.target.value)}
              placeholder="Group"
              className={inputClass}
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-md bg-cream-accent px-3 py-1.5 text-sm font-semibold text-cream-ink transition hover:bg-cream-accent-hover"
            >
              Save
            </button>
            <button
              onClick={cancel}
              className="rounded-md border border-cream-border px-3 py-1.5 text-sm text-cream-ink-secondary transition hover:bg-cream-bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-cream-ink">{item.title}</p>
              {item.description && (
                <div className="manage-md mt-1 text-sm text-cream-ink-secondary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {item.description}
                  </ReactMarkdown>
                </div>
              )}
              {showPriorityGroup && item.priority_group && (
                <p className="mt-1.5 text-xs text-cream-ink-tertiary">
                  {item.priority_group}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {showAppBadge && (
                <span className="inline-flex items-center rounded-full bg-cream-bg-secondary px-2.5 py-0.5 text-xs font-medium text-cream-ink-secondary">
                  {APP_LABELS[item.app]}
                </span>
              )}
              <PriorityBadge priority={item.priority} />
              <StatusBadge status={item.status} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cream-border pt-3">
            <label className="text-xs text-cream-ink-tertiary">Status</label>
            <select
              value={item.status}
              onChange={(e) =>
                onUpdate(item.id, { status: e.target.value as ItemStatus })
              }
              className="rounded-md border border-cream-border bg-cream-surface px-2 py-1 text-xs text-cream-ink outline-none"
            >
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <label className="ml-2 text-xs text-cream-ink-tertiary">
              Priority
            </label>
            <select
              value={item.priority}
              onChange={(e) =>
                onUpdate(item.id, {
                  priority: e.target.value as ItemPriority,
                })
              }
              className="rounded-md border border-cream-border bg-cream-surface px-2 py-1 text-xs text-cream-ink outline-none"
            >
              {ITEM_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setEditing(true)}
              className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-cream-ink-secondary transition hover:bg-cream-bg-secondary"
            >
              Edit
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded-md bg-cream-error px-2 py-1 text-xs font-medium text-white transition hover:opacity-90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md px-2 py-1 text-xs text-cream-ink-secondary transition hover:bg-cream-bg-secondary"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-md px-2 py-1 text-xs font-medium text-cream-error transition hover:bg-cream-error/10"
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </li>
  );
}
