// Pull TestFlight beta feedback (screenshots + crashes) for one app from ASC,
// re-host screenshots in Supabase Storage (Apple's signed URLs expire ~24h),
// and upsert feedback rows. Idempotent — re-running with no new feedback is a no-op.

import { asc, getAscAppId } from "./client";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import type { AppSlug, FeedbackSource } from "@/lib/constants";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year
const SCREENSHOT_BUCKET = "feedback-screenshots";

type AscResource<TAttrs, TRels = Record<string, never>> = {
  id: string;
  type: string;
  attributes: TAttrs;
  relationships?: TRels;
};

type Build = AscResource<{
  version: string;
  uploadedDate: string;
}>;

type FeedbackRels = { build?: { data?: { id: string } } };

type ScreenshotAsset = { fileName: string; url: string };
type ScreenshotAttrs = {
  comment: string | null;
  createdDate: string;
  deviceModel?: string;
  osVersion?: string;
  locale?: string;
  bookmarked?: boolean;
  screenshots?: ScreenshotAsset[];
};

type CrashAttrs = {
  comment: string | null;
  createdDate: string;
  deviceModel?: string;
  osVersion?: string;
  locale?: string;
  bookmarked?: boolean;
  crashLogFileName?: string;
  crashLog?: { url: string; fileName?: string };
};

type AscList<T> = { data: T[]; included?: Build[]; links?: { next?: string } };

export type PullResult = {
  inserted: number;
  updated: number;
  buildsScanned: number;
};

// Apple exposes beta feedback under the app-scoped endpoint. The build-scoped
// variant (/v1/builds/{id}/betaFeedbackScreenshotSubmissions) returns empty
// for some apps even when feedback exists — observed on splittr 2026-05-19.
async function fetchAppFeedback<T>(
  appId: string,
  kind: "betaFeedbackScreenshotSubmissions" | "betaFeedbackCrashSubmissions",
): Promise<{ items: AscResource<T, FeedbackRels>[]; buildsById: Map<string, Build> }> {
  const res = await asc<AscList<AscResource<T, FeedbackRels>>>(
    `/v1/apps/${appId}/${kind}?limit=200&include=build&fields[builds]=version,uploadedDate`,
  ).catch(() => ({ data: [], included: [] as Build[] }));
  const buildsById = new Map<string, Build>();
  for (const b of res.included ?? []) buildsById.set(b.id, b);
  return { items: res.data, buildsById };
}

function resolveBuild(
  item: AscResource<unknown, FeedbackRels>,
  buildsById: Map<string, Build>,
): Build {
  const id = item.relationships?.build?.data?.id;
  const found = id ? buildsById.get(id) : undefined;
  return (
    found ?? {
      id: id ?? "",
      type: "builds",
      attributes: { version: "?", uploadedDate: "" },
    }
  );
}

/** Pull beta feedback for one app and upsert into the feedback table. */
export async function pullFeedbackForApp(app: AppSlug): Promise<PullResult> {
  const appId = getAscAppId(app);

  let inserted = 0;
  let updated = 0;

  const screenshots = await fetchAppFeedback<ScreenshotAttrs>(
    appId,
    "betaFeedbackScreenshotSubmissions",
  );
  for (const s of screenshots.items) {
    const r = await upsertScreenshot(app, resolveBuild(s, screenshots.buildsById), s);
    if (r === "inserted") inserted++;
    else if (r === "updated") updated++;
  }

  const crashes = await fetchAppFeedback<CrashAttrs>(
    appId,
    "betaFeedbackCrashSubmissions",
  );
  for (const c of crashes.items) {
    const r = await upsertCrash(app, resolveBuild(c, crashes.buildsById), c);
    if (r === "inserted") inserted++;
    else if (r === "updated") updated++;
  }

  return {
    inserted,
    updated,
    buildsScanned: screenshots.buildsById.size + crashes.buildsById.size,
  };
}

type UpsertOutcome = "inserted" | "updated" | "noop";

async function upsertScreenshot(
  app: AppSlug,
  build: Build,
  s: AscResource<ScreenshotAttrs, FeedbackRels>,
): Promise<UpsertOutcome> {
  const supabase = getSupabaseAdmin();
  const source: FeedbackSource = "testflight_screenshot";

  // Existing row?
  const { data: existing } = await supabase
    .from("feedback")
    .select("id, screenshot_url")
    .eq("source", source)
    .eq("external_id", s.id)
    .maybeSingle();

  let screenshotUrl: string | null = existing?.screenshot_url ?? null;

  // Only attempt re-host if we don't have a URL yet and Apple gave us one.
  if (!screenshotUrl && s.attributes.screenshots?.[0]?.url) {
    screenshotUrl = await rehostScreenshot(
      app,
      s.id,
      s.attributes.screenshots[0],
    ).catch(() => null);
  }

  const row = {
    app,
    source,
    external_id: s.id,
    message: s.attributes.comment?.trim() || `[Screenshot feedback · build ${build.attributes.version}]`,
    email: null,
    category: "other" as const,
    status: "new" as const,
    screenshot_url: screenshotUrl,
    device_info: {
      deviceModel: s.attributes.deviceModel,
      osVersion: s.attributes.osVersion,
      locale: s.attributes.locale,
      buildVersion: build.attributes.version,
      submittedAt: s.attributes.createdDate,
    },
    created_at: s.attributes.createdDate,
  };

  if (existing) {
    await supabase
      .from("feedback")
      .update({ screenshot_url: screenshotUrl, device_info: row.device_info })
      .eq("id", existing.id);
    return screenshotUrl !== existing.screenshot_url ? "updated" : "noop";
  }
  await supabase.from("feedback").insert(row);
  return "inserted";
}

async function upsertCrash(
  app: AppSlug,
  build: Build,
  c: AscResource<CrashAttrs, FeedbackRels>,
): Promise<UpsertOutcome> {
  const supabase = getSupabaseAdmin();
  const source: FeedbackSource = "testflight_crash";

  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("source", source)
    .eq("external_id", c.id)
    .maybeSingle();

  const row = {
    app,
    source,
    external_id: c.id,
    message:
      c.attributes.comment?.trim() ||
      `[Crash · build ${build.attributes.version}${c.attributes.crashLogFileName ? ` · ${c.attributes.crashLogFileName}` : ""}]`,
    email: null,
    category: "bug" as const,
    status: "new" as const,
    screenshot_url: null,
    device_info: {
      deviceModel: c.attributes.deviceModel,
      osVersion: c.attributes.osVersion,
      locale: c.attributes.locale,
      buildVersion: build.attributes.version,
      crashLogUrl: c.attributes.crashLog?.url,
      submittedAt: c.attributes.createdDate,
    },
    created_at: c.attributes.createdDate,
  };

  if (existing) return "noop";
  await supabase.from("feedback").insert(row);
  return "inserted";
}

async function rehostScreenshot(
  app: AppSlug,
  submissionId: string,
  asset: ScreenshotAsset,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const res = await fetch(asset.url);
  if (!res.ok) return null;
  const buf = new Uint8Array(await res.arrayBuffer());
  const path = `${app}/${submissionId}.png`;
  const { error: upErr } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, buf, { contentType: "image/png", upsert: true });
  if (upErr) return null;
  const { data: signed, error: signErr } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signErr || !signed) return null;
  return signed.signedUrl;
}
