import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { FEEDBACK_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Public, unauthenticated endpoint — explicitly NOT covered by middleware.ts.
// Hardened with strict length/shape validation. A proper IP rate-limiter
// (e.g. Vercel KV / Upstash) is a recommended follow-up before heavy traffic.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (message.length < 1) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Message is too long (5000 character max)" },
      { status: 400 },
    );
  }

  let category = "other";
  if (b.category !== undefined && b.category !== null && b.category !== "") {
    if (
      typeof b.category !== "string" ||
      !FEEDBACK_CATEGORIES.includes(b.category as never)
    ) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    category = b.category;
  }

  let email: string | null = null;
  if (b.email !== undefined && b.email !== null && b.email !== "") {
    const raw = typeof b.email === "string" ? b.email.trim() : "";
    if (raw.length > 320 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    email = raw;
  }

  const { error } = await getSupabaseAdmin()
    .from("feedback")
    .insert({ message, category, email });
  if (error) {
    return NextResponse.json(
      { error: "Could not save feedback. Try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
