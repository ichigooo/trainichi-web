// Small status pill, shared by improvements/todos (queued/in_progress/done)
// and feedback (new/reviewed/actioned/archived).

const TONES: Record<string, string> = {
  queued: "bg-cream-bg-secondary text-cream-ink-secondary",
  in_progress: "bg-cream-accent text-cream-ink",
  done: "bg-cream-success/20 text-cream-success",
  new: "bg-cream-accent text-cream-ink",
  reviewed: "bg-cream-info/15 text-cream-info",
  actioned: "bg-cream-success/20 text-cream-success",
  archived: "bg-cream-bg-secondary text-cream-ink-tertiary",
};

function label(status: string) {
  return status.replace(/_/g, " ");
}

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? "bg-cream-bg-secondary text-cream-ink-secondary";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {label(status)}
    </span>
  );
}
