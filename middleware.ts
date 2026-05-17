import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAuthenticated } from "@/lib/auth";

// Paths inside the matcher that must stay reachable WITHOUT a session,
// otherwise you could never log in.
const PUBLIC_PATHS = new Set([
  "/manage/login",
  "/api/admin/login",
  "/api/admin/logout",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (await isAuthenticated(token)) {
    return NextResponse.next();
  }

  // Unauthenticated: API routes get a 401, pages get redirected to login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/manage/login", request.url);
  return NextResponse.redirect(loginUrl);
}

// Only gates the owner dashboard and its API. Does NOT touch `/`, `/feedback`,
// `/api/feedback`, `/api/meta/*`, `/oembed-test`, or the `/splittr` rewrite.
export const config = {
  matcher: ["/manage/:path*", "/api/admin/:path*"],
};
