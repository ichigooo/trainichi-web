import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminGuard";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const { data, error } = await getSupabaseAdmin()
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data });
}
