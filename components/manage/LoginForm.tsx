"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/manage");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Incorrect password");
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-cream-ink-secondary"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          className="mt-1.5 w-full rounded-[10px] border border-cream-border bg-cream-surface px-3 py-2.5 text-cream-ink outline-none transition focus:border-cream-accent-pressed"
        />
      </div>
      {error && <p className="text-sm text-cream-error">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-md bg-cream-accent px-4 py-2.5 font-semibold text-cream-ink transition hover:bg-cream-accent-hover disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
