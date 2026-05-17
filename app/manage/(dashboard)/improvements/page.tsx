import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { ItemBoard } from "@/components/manage/ItemBoard";
import type { Improvement } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ImprovementsPage() {
  const { data, error } = await getSupabaseAdmin()
    .from("improvements")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream-ink">Improvements</h1>
      <p className="mb-6 mt-1 text-sm text-cream-ink-secondary">
        Branding, infra, and feature work. This dashboard is the source of
        truth.
      </p>
      {error ? (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          Couldn&apos;t load improvements: {error.message}
        </p>
      ) : (
        <ItemBoard
          resource="improvements"
          initialItems={(data ?? []) as Improvement[]}
          showPriorityGroup={false}
        />
      )}
    </div>
  );
}
