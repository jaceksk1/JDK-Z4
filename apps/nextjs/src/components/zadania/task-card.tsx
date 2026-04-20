import type { TaskStatus } from "@acme/validators";

import { cn } from "@acme/ui";

const TASK_STATUS: Record<TaskStatus, { label: string; cssVar: string }> = {
  open: { label: "Otwarte", cssVar: "to-check" },
  submitted: { label: "Zgłoszone", cssVar: "in-progress" },
  done: { label: "Zamknięte", cssVar: "done" },
};

interface TaskCardProps {
  id: string;
  title: string;
  status: TaskStatus;
  createdByName: string;
  assignedToName: string | null;
  createdAt: Date;
  dueDate: Date | null;
  unitDesignator?: string | null;
  onClick: () => void;
  isActive?: boolean;
}

export function TaskCard({
  title,
  status,
  createdByName,
  assignedToName,
  createdAt,
  dueDate,
  unitDesignator,
  onClick,
  isActive,
}: TaskCardProps) {
  const cfg = TASK_STATUS[status];
  const isOverdue =
    status === "open" && dueDate && new Date(dueDate) < new Date();

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-sm border bg-card p-4 text-left shadow-xs transition-all",
        "hover:border-primary/40 hover:shadow-sm",
        isActive && "ring-2 ring-primary border-primary",
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: `var(--status-${cfg.cssVar})`,
      }}
    >
      {/* Top row */}
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span
          className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, var(--status-${cfg.cssVar}) 15%, transparent)`,
            color: `var(--status-${cfg.cssVar})`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: `var(--status-${cfg.cssVar})` }}
          />
          {cfg.label}
        </span>
        {unitDesignator && (
          <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-muted-foreground">
            {unitDesignator}
          </span>
        )}
        {isOverdue && (
          <span className="rounded-sm bg-[var(--status-issue)]/15 px-1.5 py-0.5 font-medium text-[var(--status-issue)]">
            Po terminie
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {formatTimeAgo(createdAt)}
        </span>
      </div>

      {/* Title */}
      <p className="line-clamp-2 text-sm font-medium leading-relaxed">
        {title}
      </p>

      {/* Footer */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{createdByName}</span>
        {assignedToName && (
          <>
            <span className="text-muted-foreground/40">→</span>
            <span>{assignedToName}</span>
          </>
        )}
        {dueDate && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <span className={isOverdue ? "text-[var(--status-issue)]" : ""}>
              {new Date(dueDate).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "teraz";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}
