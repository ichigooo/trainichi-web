import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/adminGuard";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  isAppSlug,
  type AppSlug,
} from "@/lib/constants";

// Shared CRUD logic for the `improvements` and `todos` tables — they share a
// schema except `todos` also has a free-text `priority_group`.

export type ItemResource = "improvements" | "todos";

type ParsedItem = {
  app?: AppSlug;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  priority_group?: string | null;
};

function parseItemBody(
  body: unknown,
  resource: ItemResource,
  requireTitle: boolean,
): { data?: ParsedItem; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid body" };
  }
  const b = body as Record<string, unknown>;
  const data: ParsedItem = {};

  if (b.app !== undefined) {
    if (!isAppSlug(b.app)) return { error: "Invalid app" };
    data.app = b.app;
  } else if (requireTitle) {
    return { error: "app is required" };
  }

  if (b.title !== undefined) {
    if (typeof b.title !== "string" || b.title.trim().length === 0) {
      return { error: "Title must be a non-empty string" };
    }
    if (b.title.length > 300) return { error: "Title is too long" };
    data.title = b.title.trim();
  } else if (requireTitle) {
    return { error: "Title is required" };
  }

  if (b.description !== undefined) {
    if (b.description !== null && typeof b.description !== "string") {
      return { error: "Description must be a string" };
    }
    data.description =
      typeof b.description === "string" ? b.description.slice(0, 5000) : null;
  }

  if (b.status !== undefined) {
    if (!ITEM_STATUSES.includes(b.status as never)) {
      return { error: "Invalid status" };
    }
    data.status = b.status as string;
  }

  if (b.priority !== undefined) {
    if (!ITEM_PRIORITIES.includes(b.priority as never)) {
      return { error: "Invalid priority" };
    }
    data.priority = b.priority as string;
  }

  if (resource === "todos" && b.priority_group !== undefined) {
    if (b.priority_group !== null && typeof b.priority_group !== "string") {
      return { error: "priority_group must be a string" };
    }
    data.priority_group =
      typeof b.priority_group === "string"
        ? b.priority_group.trim().slice(0, 120) || null
        : null;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No valid fields supplied" };
  }
  return { data };
}

/** GET (list) + POST (create) handlers for /api/admin/{resource}. */
export function makeItemCollectionRoute(resource: ItemResource) {
  async function GET(request: Request) {
    if (!(await isAdminRequest())) return unauthorized();
    const url = new URL(request.url);
    const appParam = url.searchParams.get("app");
    let query = getSupabaseAdmin()
      .from(resource)
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

  async function POST(request: Request) {
    if (!(await isAdminRequest())) return unauthorized();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { data, error } = parseItemBody(body, resource, true);
    if (error || !data) {
      return NextResponse.json({ error: error ?? "Invalid body" }, {
        status: 400,
      });
    }
    const result = await getSupabaseAdmin()
      .from(resource)
      .insert(data)
      .select()
      .single();
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, {
        status: 500,
      });
    }
    return NextResponse.json({ item: result.data }, { status: 201 });
  }

  return { GET, POST };
}

/** PATCH (update) + DELETE handlers for /api/admin/{resource}/[id]. */
export function makeItemIdRoute(resource: ItemResource) {
  async function PATCH(
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
    const { data, error } = parseItemBody(body, resource, false);
    if (error || !data) {
      return NextResponse.json({ error: error ?? "Invalid body" }, {
        status: 400,
      });
    }
    const result = await getSupabaseAdmin()
      .from(resource)
      .update(data)
      .eq("id", params.id)
      .select()
      .single();
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, {
        status: 500,
      });
    }
    return NextResponse.json({ item: result.data });
  }

  async function DELETE(
    _request: Request,
    { params }: { params: { id: string } },
  ) {
    if (!(await isAdminRequest())) return unauthorized();
    const { error } = await getSupabaseAdmin()
      .from(resource)
      .delete()
      .eq("id", params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return { PATCH, DELETE };
}
