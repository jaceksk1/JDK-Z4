import type { UnitStatus, UnitType } from "@acme/validators";

import { cn } from "@acme/ui";

import { StatusDot } from "~/components/unit/status-badge";

interface UnitCardProps {
  designator: string;
  type: UnitType;
  status: UnitStatus;
  onClick: () => void;
  isActive?: boolean;
}

export function UnitCard({
  designator,
  type,
  status,
  onClick,
  isActive,
}: UnitCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-1.5 rounded-sm border bg-card p-3 text-left shadow-xs transition-all",
        "hover:border-primary/40 hover:shadow-sm",
        isActive && "ring-2 ring-primary border-primary",
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: `var(--status-${status.replace("_", "-")})`,
      }}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold tracking-tight">
          {designator}
        </span>
        <StatusDot status={status} />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {TYPE_LABEL[type]}
      </span>
    </button>
  );
}

const TYPE_LABEL: Record<UnitType, string> = {
  apartment: "Mieszkanie",
  commercial: "Lokal usług.",
  parking: "MP",
  storage: "KL",
};
