import type { UnitStatus } from "@acme/validators";

import { cn } from "@acme/ui";

const STATUS_CONFIG: Record<
  UnitStatus,
  { label: string; className: string }
> = {
  not_started: {
    label: "Nie rozpoczęte",
    className:
      "bg-[var(--status-not-started)] text-[var(--status-not-started-fg)]",
  },
  in_progress: {
    label: "W toku",
    className:
      "bg-[var(--status-in-progress)] text-[var(--status-in-progress-fg)]",
  },
  to_check: {
    label: "Do sprawdzenia",
    className:
      "bg-[var(--status-to-check)] text-[var(--status-to-check-fg)]",
  },
  done: {
    label: "Gotowe",
    className: "bg-[var(--status-done)] text-[var(--status-done-fg)]",
  },
  issue: {
    label: "Problem",
    className: "bg-[var(--status-issue)] text-[var(--status-issue-fg)]",
  },
};

interface StatusBadgeProps {
  status: UnitStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm font-medium",
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2 py-0.5 text-xs",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

/** Mała kropka statusu — do użycia np. przy nazwie jednostki */
export function StatusDot({
  status,
  className,
}: {
  status: UnitStatus;
  className?: string;
}) {
  const colorVar = {
    not_started: "var(--status-not-started)",
    in_progress: "var(--status-in-progress)",
    to_check: "var(--status-to-check)",
    done: "var(--status-done)",
    issue: "var(--status-issue)",
  }[status];

  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", className)}
      style={{ backgroundColor: colorVar }}
      aria-label={STATUS_CONFIG[status].label}
    />
  );
}
