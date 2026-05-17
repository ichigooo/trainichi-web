import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { FeedbackTable } from "@/components/manage/FeedbackTable";
import type { Feedback } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const { data, error } = await getSupabaseAdmin()
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream-ink">Feedback</h1>
      <p className="mb-6 mt-1 text-sm text-cream-ink-secondary">
        Submissions from the public feedback page.
      </p>
      {error ? (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          Couldn&apos;t load feedback: {error.message}
        </p>
      ) : (
        <FeedbackTable initialItems={(data ?? []) as Feedback[]} />
      )}
    </div>
  );
}
