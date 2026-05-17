// Shared constants & enums for trainichi-web.

// TestFlight invite link — placeholder until the real public link exists.
export const TESTFLIGHT_URL = "https://testflight.apple.com/";

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

// Improvements & todos
export const ITEM_STATUSES = ["queued", "in_progress", "done"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_PRIORITIES = ["low", "medium", "high"] as const;
export type ItemPriority = (typeof ITEM_PRIORITIES)[number];

// Row shapes returned from Supabase
export type Feedback = {
  id: string;
  message: string;
  email: string | null;
  category: FeedbackCategory;
  status: FeedbackStatus;
  created_at: string;
};

export type Improvement = {
  id: string;
  title: string;
  description: string | null;
  status: ItemStatus;
  priority: ItemPriority;
  created_at: string;
  updated_at: string;
};

export type Todo = {
  id: string;
  title: string;
  description: string | null;
  status: ItemStatus;
  priority: ItemPriority;
  priority_group: string | null;
  created_at: string;
  updated_at: string;
};
