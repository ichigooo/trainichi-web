import { NextResponse } from "next/server";
import { isAppSlug } from "@/lib/constants";
import { parseTrackerMarkdown } from "@/lib/markdown/parseTrackers";
import { applyInboundTrackers } from "@/lib/sync/merge";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Bearer-auth (not cookie) — invoked by the per-repo GitHub Action.
function verifyBearer(req: Request): boolean {
  const expected = process.env.MANAGE_SYNC_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!verifyBearer(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown> | null;
  const app = b?.app;
  if (!isAppSlug(app)) {
    return NextResponse.json({ error: "Invalid app" }, { status: 400 });
  }
  const improvementsMd = typeof b?.improvements === "string" ? b.improvements : "";
  const todosMd = typeof b?.todos === "string" ? b.todos : "";

  try {
    const improvementsResult = await applyInboundTrackers(
      "improvements",
      app,
      parseTrackerMarkdown(improvementsMd),
    );
    const todosResult = await applyInboundTrackers(
      "todos",
      app,
      parseTrackerMarkdown(todosMd),
    );
    return NextResponse.json({
      ok: true,
      app,
      improvements: improvementsResult,
      todos: todosResult,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
