import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminGuard";
import { pullFeedbackForApp } from "@/lib/appStore/pullFeedback";
import { parseAppFromBody } from "@/lib/appStore/client";

export const dynamic = "force-dynamic";
// ASC + storage round-trips can run long for the first pull of a busy app.
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  let app;
  try {
    app = parseAppFromBody(body);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const result = await pullFeedbackForApp(app);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
