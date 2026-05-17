// Edge-safe auth helpers for the password-gated /manage owner dashboard.
// Uses Web Crypto (crypto.subtle) only, so this module runs in both the
// middleware (Edge runtime) and route handlers (Node runtime).
// Keep this file free of `next/headers` and Node-only APIs.

export const ADMIN_COOKIE = "arete_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Opaque session token derived from ADMIN_PASSWORD. Stored in the httpOnly
 * cookie instead of the raw password. Rotating ADMIN_PASSWORD invalidates
 * all existing sessions.
 */
export async function sessionToken(): Promise<string> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is not set");
  return sha256Hex(`arete::admin::${pw}::${pw}`);
}

/** Length-safe, branchless string compare. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** True if the supplied password matches ADMIN_PASSWORD. */
export function isValidPassword(password: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is not set");
  return safeEqual(password, pw);
}

/** True if the cookie value is a valid admin session token. */
export async function isAuthenticated(
  cookieValue: string | undefined | null,
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await sessionToken();
  return safeEqual(cookieValue, expected);
}
