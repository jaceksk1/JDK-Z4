import type { TaskStatus } from "@acme/validators";

import { cn } from "@acme/ui";

const STATUSES: { value: TaskStatus; label: string; cssVar: string }[] = [
  { value: "open", label: "Otwarte", cssVar: "to-check" },
  { value: "submitted", label: "Zgłoszone", cssVar: "in-progress" },
  { value: "done", label: "Zamknięte", cssVar: "done" },
];

interface StatusFilterTasksProps {
  selected: TaskStatus | null;
  onChange: (status: TaskStatus | null) => void;
  counts?: Partial<Record<TaskStatus, number>>;
}

export function StatusFilterTasks({
  selected,
  onChange,
  counts,
}: StatusFilterTasksProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
          selected === null
            ? "bg-foreground text-background"
            : "bg-muted/50 text-muted-foreground hover:bg-muted",
        )}
      >
        Wszystkie
      </button>
      {STATUSES.map((s) => {
        const isActive = selected === s.value;
        const count = counts?.[s.value];
        return (
          <button
            key={s.value}
            onClick={() => onChange(isActive ? null : s.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
            style={
              isActive
                ? {
                    backgroundColor: `var(--status-${s.cssVar})`,
                    color: `var(--status-${s.cssVar}-fg)`,
                  }
                : undefined
            }
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: `var(--status-${s.cssVar})` }}
            />
            {s.label}
            {count !== undefined && count > 0 && (
              <span className="font-mono opacity-75">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
