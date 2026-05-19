import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminGuard";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { isAppSlug } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const url = new URL(request.url);
  const appParam = url.searchParams.get("app");
  let query = getSupabaseAdmin()
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (appParam && appParam !== "all") {
    if (!isAppSlug(appParam)) {
      return NextResponse.json({ error: "Invalid app" }, { status: 400 });
    }
    query = query.eq("app", appParam);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data });
}
