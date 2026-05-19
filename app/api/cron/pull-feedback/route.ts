import { NextResponse } from "next/server";
import { APPS } from "@/lib/constants";
import { pullFeedbackForApp } from "@/lib/appStore/pullFeedback";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron hits this endpoint with `Authorization: Bearer ${CRON_SECRET}`.
// We also accept the same bearer when invoked manually for testing.
function isCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results: Record<string, unknown> = {};
  for (const app of APPS) {
    try {
      results[app] = await pullFeedbackForApp(app);
    } catch (e) {
      results[app] = { error: (e as Error).message };
    }
  }
  return NextResponse.json({ ok: true, results });
}
