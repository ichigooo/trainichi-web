import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { ItemBoard } from "@/components/manage/ItemBoard";
import { AppTabs } from "@/components/manage/AppTabs";
import { readAppFilter } from "@/lib/appFilter";
import { PushToRepoButton } from "@/components/manage/PushToRepoButton";
import type { Todo } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: { app?: string };
}) {
  const app = readAppFilter(searchParams.app);
  let query = getSupabaseAdmin()
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });
  if (app !== "all") query = query.eq("app", app);
  const { data, error } = await query;

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream-ink">Todos</h1>
      <p className="mb-6 mt-1 text-sm text-cream-ink-secondary">
        UI polish and smaller tasks. Synced from each repo&apos;s TODO.md on
        push.
      </p>
      <AppTabs current={app} />
      <PushToRepoButton app={app} />
      {error ? (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          Couldn&apos;t load todos: {error.message}
        </p>
      ) : (
        <ItemBoard
          resource="todos"
          initialItems={(data ?? []) as Todo[]}
          showPriorityGroup
          app={app}
        />
      )}
    </div>
  );
}
