// Shared constants & enums for trainichi-web.

// TestFlight invite link — placeholder until the real public link exists.
export const TESTFLIGHT_URL = "https://testflight.apple.com/";

// Apps managed by the owner dashboard. Matches the `app_slug` enum in Supabase.
export const APPS = ["workout", "splittr", "reminder"] as const;
export type AppSlug = (typeof APPS)[number];

export const APP_LABELS: Record<AppSlug, string> = {
  workout: "Workout",
  splittr: "Splittr",
  reminder: "Reminder",
};

export function isAppSlug(value: unknown): value is AppSlug {
  return typeof value === "string" && (APPS as readonly string[]).includes(value);
}

// Feedback
export const FEEDBACK_CATEGORIES = ["bug", "idea", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = [
  "new",
  "reviewed",
  "actioned",
  "archived",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_SOURCES = [
  "web",
  "testflight_screenshot",
  "testflight_crash",
] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

export const FEEDBACK_SOURCE_LABELS: Record<FeedbackSource, string> = {
  web: "Web",
  testflight_screenshot: "TF Screenshot",
  testflight_crash: "TF Crash",
};

// Improvements & todos
export const ITEM_STATUSES = ["queued", "in_progress", "done"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_PRIORITIES = ["low", "medium", "high"] as const;
export type ItemPriority = (typeof ITEM_PRIORITIES)[number];

// Row shapes returned from Supabase
export type Feedback = {
  id: string;
  app: AppSlug;
  message: string;
  email: string | null;
  category: FeedbackCategory;
  status: FeedbackStatus;
  source: FeedbackSource;
  external_id: string | null;
  screenshot_url: string | null;
  device_info: Record<string, unknown> | null;
  created_at: string;
};

export type Improvement = {
  id: string;
  app: AppSlug;
  title: string;
  description: string | null;
  status: ItemStatus;
  priority: ItemPriority;
  external_key: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  id: string;
  app: AppSlug;
  title: string;
  description: string | null;
  status: ItemStatus;
  priority: ItemPriority;
  priority_group: string | null;
  external_key: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};
