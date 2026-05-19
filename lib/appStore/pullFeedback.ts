// Pull TestFlight beta feedback (screenshots + crashes) for one app from ASC,
// re-host screenshots in Supabase Storage (Apple's signed URLs expire ~24h),
// and upsert feedback rows. Idempotent — re-running with no new feedback is a no-op.

import { asc, getAscAppId } from "./client";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import type { AppSlug, FeedbackSource } from "@/lib/constants";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year
const SCREENSHOT_BUCKET = "feedback-screenshots";
// Look at the N most recent builds. Beta feedback is per-build; older builds
// rarely receive new feedback so this is plenty.
const BUILD_FETCH_LIMIT = 10;

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

type AscList<T> = { data: T[]; links?: { next?: string } };

export type PullResult = {
  inserted: number;
  updated: number;
  buildsScanned: number;
};

/** Pull beta feedback for one app and upsert into the feedback table. */
export async function pullFeedbackForApp(app: AppSlug): Promise<PullResult> {
  const appId = getAscAppId(app);
  const builds = await asc<AscList<Build>>(
    `/v1/apps/${appId}/builds?limit=${BUILD_FETCH_LIMIT}&sort=-uploadedDate&fields[builds]=version,uploadedDate`,
  );

  let inserted = 0;
  let updated = 0;

  for (const build of builds.data) {
    const screenshots = await asc<AscList<AscResource<ScreenshotAttrs>>>(
      `/v1/builds/${build.id}/betaFeedbackScreenshotSubmissions?limit=200`,
    ).catch(() => ({ data: [] }));

    for (const s of screenshots.data) {
      const r = await upsertScreenshot(app, build, s);
      if (r === "inserted") inserted++;
      else if (r === "updated") updated++;
    }

    const crashes = await asc<AscList<AscResource<CrashAttrs>>>(
      `/v1/builds/${build.id}/betaFeedbackCrashSubmissions?limit=200`,
    ).catch(() => ({ data: [] }));

    for (const c of crashes.data) {
      const r = await upsertCrash(app, build, c);
      if (r === "inserted") inserted++;
      else if (r === "updated") updated++;
    }
  }

  return { inserted, updated, buildsScanned: builds.data.length };
}

type UpsertOutcome = "inserted" | "updated" | "noop";

async function upsertScreenshot(
  app: AppSlug,
  build: Build,
  s: AscResource<ScreenshotAttrs>,
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
  c: AscResource<CrashAttrs>,
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
