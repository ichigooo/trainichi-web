// Tiny GitHub Contents-API client (PUT to update a file via classic PAT).
// We avoid taking an @octokit/rest dependency — only one call shape is needed.

import type { AppSlug } from "@/lib/constants";

// Repo mapping per app. Keep in sync with the dashboard's app slugs.
export const APP_REPO: Record<AppSlug, { owner: string; repo: string }> = {
  workout: { owner: "ichigooo", repo: "Workout-Planner" },
  splittr: { owner: "ichigooo", repo: "expense-splitter" },
  reminder: { owner: "ichigooo", repo: "reminder-app" },
};

const GH_BASE = "https://api.github.com";

function authHeaders(): Record<string, string> {
  const token = process.env.GH_APP_TOKEN;
  if (!token) throw new Error("GH_APP_TOKEN env var is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

type ContentsResponse = { sha: string; content: string };

/** Read a file's current SHA + base64 content. Returns null if 404. */
export async function ghGetFile(
  owner: string,
  repo: string,
  path: string,
  ref = "main",
): Promise<ContentsResponse | null> {
  const res = await fetch(
    `${GH_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`,
    { headers: authHeaders(), cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as ContentsResponse;
  return json;
}

/** Create or update a file. No-op (returns false) when content is unchanged. */
export async function ghPutFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch = "main",
): Promise<boolean> {
  const existing = await ghGetFile(owner, repo, path, branch);
  const newB64 = Buffer.from(content, "utf-8").toString("base64");
  if (existing && existing.content.replace(/\s/g, "") === newB64.replace(/\s/g, "")) {
    return false;
  }
  const body: Record<string, unknown> = {
    message,
    content: newB64,
    branch,
  };
  if (existing) body.sha = existing.sha;
  const res = await fetch(
    `${GH_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub PUT ${path}: ${res.status} ${await res.text()}`);
  }
  return true;
}
