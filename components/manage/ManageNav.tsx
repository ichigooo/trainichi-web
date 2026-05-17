"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/manage/improvements", label: "Improvements" },
  { href: "/manage/todos", label: "Todos" },
  { href: "/manage/feedback", label: "Feedback" },
];

export function ManageNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/manage/login");
    router.refresh();
  }

  return (
    <header className="border-b border-cream-border bg-cream-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-sans text-xl font-semibold tracking-tight text-cream-ink">
            Aretē
          </span>
          <nav className="flex gap-1">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-cream-accent text-cream-ink"
                      : "text-cream-ink-secondary hover:bg-cream-bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-cream-border px-3 py-1.5 text-sm font-medium text-cream-ink-secondary transition hover:bg-cream-bg-secondary"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
