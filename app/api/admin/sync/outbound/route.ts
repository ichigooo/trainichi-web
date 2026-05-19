import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminGuard";
import { isAppSlug } from "@/lib/constants";
import { pushOutboundForApp } from "@/lib/sync/outbound";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
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
  const force = b?.force === true;
  try {
    const result = await pushOutboundForApp(app, { force });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
