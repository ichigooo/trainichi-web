import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { ItemBoard } from "@/components/manage/ItemBoard";
import type { Todo } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const { data, error } = await getSupabaseAdmin()
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream-ink">Todos</h1>
      <p className="mb-6 mt-1 text-sm text-cream-ink-secondary">
        UI polish and smaller tasks. Use the group field to bucket by priority
        tier.
      </p>
      {error ? (
        <p className="rounded-md border border-cream-error/40 bg-cream-error/10 px-3 py-2 text-sm text-cream-error">
          Couldn&apos;t load todos: {error.message}
        </p>
      ) : (
        <ItemBoard
          resource="todos"
          initialItems={(data ?? []) as Todo[]}
          showPriorityGroup
        />
      )}
    </div>
  );
}
