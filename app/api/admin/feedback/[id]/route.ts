import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminGuard";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { FEEDBACK_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Only the `status` field is editable on a feedback row — message/email/
// category are immutable user submissions.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest())) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = (body as Record<string, unknown> | null)?.status;
  if (typeof status !== "string" || !FEEDBACK_STATUSES.includes(status as never)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("feedback")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest())) return unauthorized();
  const { error } = await getSupabaseAdmin()
    .from("feedback")
    .delete()
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
