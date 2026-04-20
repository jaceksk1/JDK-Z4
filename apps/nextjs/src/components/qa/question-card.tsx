import type { QuestionStatus } from "@acme/validators";

import { cn } from "@acme/ui";

const QA_STATUS: Record<
  QuestionStatus,
  { label: string; cssVar: string }
> = {
  open: { label: "Otwarte", cssVar: "to-check" },
  answered: { label: "Odpowiedziane", cssVar: "done" },
  resolved: { label: "Zamknięte", cssVar: "not-started" },
};

interface QuestionCardProps {
  id: string;
  content: string;
  status: QuestionStatus;
  askedByName: string;
  createdAt: Date;
  unitDesignator?: string | null;
  hasAnswer: boolean;
  onClick: () => void;
  isActive?: boolean;
}

export function QuestionCard({
  content,
  status,
  askedByName,
  createdAt,
  unitDesignator,
  hasAnswer,
  onClick,
  isActive,
}: QuestionCardProps) {
  const cfg = QA_STATUS[status];
  const timeAgo = formatTimeAgo(createdAt);

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
      {/* Top row: status + unit + time */}
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
        <span className="ml-auto text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Content preview */}
      <p className="line-clamp-2 text-sm leading-relaxed">{content}</p>

      {/* Footer */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{askedByName}</span>
        {hasAnswer && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-[var(--status-done)]">Odpowiedź</span>
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
