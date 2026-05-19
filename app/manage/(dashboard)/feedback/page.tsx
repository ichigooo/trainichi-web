import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { FeedbackTable } from "@/components/manage/FeedbackTable";
import { AppTabs } from "@/components/manage/AppTabs";
import { readAppFilter } from "@/lib/appFilter";
import type { Feedback } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { app?: string };
}) {
  const app = readAppFilter(searchParams.app);
  let query = getSupabaseAdmin()
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (app !== "all") query = query.eq("app", app);
  const { data, error } = await query;

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream-ink">Feedback</h1>
      <p className="mb-6 mt-1 text-sm text-cream-ink-secondary">
        Public web submissions and TestFlight screenshot/crash feedback. Pick
        an app, then pull the latest.
      </p>
      <AppTabs current={app} />
      {error ? (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          Couldn&apos;t load feedback: {error.message}
        </p>
      ) : (
        <FeedbackTable
          initialItems={(data ?? []) as Feedback[]}
          app={app}
        />
      )}
    </div>
  );
}
