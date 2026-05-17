const TONES: Record<string, string> = {
  high: "bg-cream-error/15 text-cream-error",
  medium: "bg-cream-warning/15 text-cream-warning",
  low: "bg-cream-bg-secondary text-cream-ink-tertiary",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const tone = TONES[priority] ?? TONES.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {priority}
    </span>
  );
}
