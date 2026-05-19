// Minimal App Store Connect API client.
// JWT (ES256) signed with the .p8 private key from ASC → Users & Access → Integrations → Keys.
// We only call a handful of endpoints (builds + beta feedback) so we avoid taking
// on a full SDK dependency. ES256 signing uses Web Crypto's raw r||s format —
// which is exactly what JWS expects, no DER conversion needed.

import { isAppSlug, type AppSlug } from "@/lib/constants";

const ASC_BASE = "https://api.appstoreconnect.apple.com";
const TOKEN_TTL_SECONDS = 60 * 15; // 15 min; ASC max is 20

type Env = {
  issuer: string;
  keyId: string;
  privateKeyPem: string;
  appIds: Record<AppSlug, string>;
};

function readEnv(): Env {
  const issuer = process.env.ASC_ISSUER_ID;
  const keyId = process.env.ASC_KEY_ID;
  // PEM may contain literal `\n` when pasted into a single-line env var
  const privateKeyPem = process.env.ASC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const idsJson = process.env.ASC_APP_IDS_JSON;
  if (!issuer || !keyId || !privateKeyPem || !idsJson) {
    throw new Error(
      "ASC env missing: need ASC_ISSUER_ID, ASC_KEY_ID, ASC_PRIVATE_KEY, ASC_APP_IDS_JSON",
    );
  }
  let appIds: Record<string, string>;
  try {
    appIds = JSON.parse(idsJson);
  } catch {
    throw new Error("ASC_APP_IDS_JSON is not valid JSON");
  }
  return { issuer, keyId, privateKeyPem, appIds: appIds as Record<AppSlug, string> };
}

export function getAscAppId(app: AppSlug): string {
  const { appIds } = readEnv();
  const id = appIds[app];
  if (!id) throw new Error(`No ASC app id configured for "${app}" in ASC_APP_IDS_JSON`);
  return id;
}

function base64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new Uint8Array(input);
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Token cache — re-sign at most once per TTL window.
let cachedToken: { token: string; exp: number } | null = null;

async function signJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - now > 60) return cachedToken.token;

  const env = readEnv();
  const header = { alg: "ES256", kid: env.keyId, typ: "JWT" };
  const payload = {
    iss: env.issuer,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    aud: "appstoreconnect-v1",
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(env.privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );

  const token = `${signingInput}.${base64url(sig)}`;
  cachedToken = { token, exp: now + TOKEN_TTL_SECONDS };
  return token;
}

/** Low-level ASC fetch. `path` should start with `/v1/...`. Throws on non-2xx. */
export async function asc<T = unknown>(path: string): Promise<T> {
  const token = await signJwt();
  const res = await fetch(`${ASC_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // ASC responses can be large; cache disabled
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ASC ${res.status} ${path}: ${text.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}

/** Helper for the AppSlug coercion used inside route handlers. */
export function parseAppFromBody(body: unknown): AppSlug {
  const app = (body as Record<string, unknown> | null)?.app;
  if (!isAppSlug(app)) throw new Error("Invalid or missing app");
  return app;
}
