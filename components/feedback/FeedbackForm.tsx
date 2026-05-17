"use client";

import { useState } from "react";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/constants";

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: "Something's broken",
  idea: "I wish it did…",
  other: "Something else",
};

const inputClass =
  "w-full rounded-[10px] border border-cream-border bg-cream-surface px-3.5 py-2.5 text-cream-ink outline-none transition focus:border-cream-accent-pressed";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("other");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a message first.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
          category,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setMessage("");
        setEmail("");
        setCategory("other");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setStatus("error");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-card border border-cream-border bg-cream-surface p-6 shadow-subtle">
        <p className="font-serif text-xl text-cream-ink">Thank you 🤍</p>
        <p className="mt-2 text-sm text-cream-ink-secondary">
          Your feedback landed. We read every note.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-md border border-cream-border px-3.5 py-2 text-sm font-medium text-cream-ink-secondary transition hover:bg-cream-bg-secondary"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-card border border-cream-border bg-cream-surface p-6 shadow-subtle"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-cream-ink-secondary">
          What kind of feedback is this?
        </label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                category === c
                  ? "border-cream-accent-pressed bg-cream-accent text-cream-ink"
                  : "border-cream-border text-cream-ink-secondary hover:bg-cream-bg-secondary"
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block text-sm font-medium text-cream-ink-secondary"
        >
          Your message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={5000}
          required
          placeholder="Tell us what's broken, confusing, or missing…"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-cream-ink-secondary"
        >
          Email{" "}
          <span className="font-normal text-cream-ink-tertiary">
            (optional — if you want a reply)
          </span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-cream-error">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        className="rounded-md bg-cream-accent px-5 py-2.5 font-semibold text-cream-ink transition hover:bg-cream-accent-hover disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
