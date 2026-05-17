import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAuthenticated } from "@/lib/auth";

// Server-only defense-in-depth check for route handlers and server components
// under /manage and /api/admin. The middleware already gates these paths;
// this is a second check at the data-access layer.
export async function isAdminRequest(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return isAuthenticated(token);
}

/** Standard 401 JSON response for unauthenticated admin API calls. */
export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
