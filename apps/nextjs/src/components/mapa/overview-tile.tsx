import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@acme/ui";

export interface OverviewStats {
  total: number;
  not_started: number;
  in_progress: number;
  to_check: number;
  done: number;
  issue: number;
  apartment: number;
  commercial: number;
  parking: number;
  storage: number;
}

interface OverviewTileProps {
  label: string;
  stats: OverviewStats;
  href: string;
  className?: string;
}

/**
 * Tworzy sublabel w stylu "63 mieszkań + 2 LU" lub "298 MP + 184 KL".
 * Pokazuje tylko typy które są obecne (> 0).
 */
export function formatTypeBreakdown(stats: OverviewStats): string {
  const parts: string[] = [];
  if (stats.apartment > 0) parts.push(`${stats.apartment} ${pluralizeMieszkan(stats.apartment)}`);
  if (stats.commercial > 0) parts.push(`${stats.commercial} LU`);
  if (stats.parking > 0) parts.push(`${stats.parking} MP`);
  if (stats.storage > 0) parts.push(`${stats.storage} KL`);
  return parts.join(" + ");
}

function pluralizeMieszkan(n: number): string {
  if (n === 1) return "mieszkanie";
  // Odmiana polska: 2-4 "mieszkania", 5+ "mieszkań", ale uwzględniając 12-14
  const last = n % 10;
  const tens = Math.floor(n / 10) % 10;
  if (tens === 1) return "mieszkań";
  if (last >= 2 && last <= 4) return "mieszkania";
  return "mieszkań";
}

export function OverviewTile({
  label,
  stats,
  href,
  className,
}: OverviewTileProps) {
  const donePercent =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const sublabel = formatTypeBreakdown(stats);

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{label}</h3>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">
            Gotowe {stats.done}/{stats.total}
          </span>
          <span className="font-mono font-medium">{donePercent}%</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--status-done)] transition-all"
            style={{ width: `${donePercent}%` }}
          />
        </div>
      </div>

      {/* Status dots row */}
      <div className="flex items-center gap-3 text-xs">
        <StatPill count={stats.in_progress} color="in-progress" label="W toku" />
        <StatPill count={stats.to_check} color="to-check" label="Do sprawdzenia" />
        <StatPill count={stats.issue} color="issue" label="Problemy" />
      </div>
    </Link>
  );
}

function StatPill({
  count,
  color,
  label,
}: {
  count: number;
  color: "in-progress" | "to-check" | "issue";
  label: string;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: `var(--status-${color})` }}
      />
      <span className="text-muted-foreground">
        <span className="font-mono font-medium text-foreground">{count}</span>
      </span>
    </div>
  );
}
