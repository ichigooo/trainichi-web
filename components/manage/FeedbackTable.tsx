"use client";

import { useState } from "react";
import {
  FEEDBACK_STATUSES,
  type Feedback,
  type FeedbackStatus,
} from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  actioned: "Actioned",
  archived: "Archived",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function FeedbackTable({
  initialItems,
}: {
  initialItems: Feedback[];
}) {
  const [items, setItems] = useState<Feedback[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function api(path: string, method: string, body?: unknown) {
    const res = await fetch(`/api/admin/feedback${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  async function updateStatus(id: string, status: FeedbackStatus) {
    setError(null);
    const prev = items;
    setItems((p) => p.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      await api(`/${id}`, "PATCH", { status });
    } catch (err) {
      setError((err as Error).message);
      setItems(prev);
    }
  }

  async function remove(id: string) {
    setError(null);
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== id));
    setConfirmId(null);
    try {
      await api(`/${id}`, "DELETE");
    } catch (err) {
      setError((err as Error).message);
      setItems(prev);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-cream-border bg-cream-surface p-6 text-sm text-cream-ink-secondary">
        No feedback yet. Submissions from the public{" "}
        <span className="font-medium">/feedback</span> page land here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-card border border-cream-border bg-cream-surface p-4 shadow-subtle"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="whitespace-pre-wrap text-cream-ink">
                  {item.message}
                </p>
                <p className="mt-2 text-xs text-cream-ink-tertiary">
                  {item.email ? (
                    <a
                      href={`mailto:${item.email}`}
                      className="text-cream-link underline-offset-2 hover:underline"
                    >
                      {item.email}
                    </a>
                  ) : (
                    "No email"
                  )}{" "}
                  · {formatDate(item.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="inline-flex items-center rounded-full bg-cream-bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-cream-ink-secondary">
                  {item.category}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cream-border pt-3">
              <label className="text-xs text-cream-ink-tertiary">Status</label>
              <select
                value={item.status}
                onChange={(e) =>
                  updateStatus(item.id, e.target.value as FeedbackStatus)
                }
                className="rounded-md border border-cream-border bg-cream-surface px-2 py-1 text-xs text-cream-ink outline-none"
              >
                {FEEDBACK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              {confirmId === item.id ? (
                <span className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded-md bg-cream-error px-2 py-1 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-md px-2 py-1 text-xs text-cream-ink-secondary transition hover:bg-cream-bg-secondary"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmId(item.id)}
                  className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-cream-error transition hover:bg-cream-error/10"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
