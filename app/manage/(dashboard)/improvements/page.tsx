import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { ItemBoard } from "@/components/manage/ItemBoard";
import { AppTabs } from "@/components/manage/AppTabs";
import { readAppFilter } from "@/lib/appFilter";
import { PushToRepoButton } from "@/components/manage/PushToRepoButton";
import type { Improvement } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function ImprovementsPage({
  searchParams,
}: {
  searchParams: { app?: string };
}) {
  noStore();
  const app = readAppFilter(searchParams.app);
  let query = getSupabaseAdmin()
    .from("improvements")
    .select("*")
    .order("created_at", { ascending: false });
  if (app !== "all") query = query.eq("app", app);
  const { data, error } = await query;

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream-ink">Improvements</h1>
      <p className="mb-6 mt-1 text-sm text-cream-ink-secondary">
        Branding, infra, and feature work. Synced from each repo&apos;s
        IMPROVEMENTS.md on push.
      </p>
      <AppTabs current={app} />
      <PushToRepoButton app={app} />
      {error ? (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          Couldn&apos;t load improvements: {error.message}
        </p>
      ) : (
        <ItemBoard
          resource="improvements"
          initialItems={(data ?? []) as Improvement[]}
          showPriorityGroup={false}
          app={app}
        />
      )}
    </div>
  );
}
