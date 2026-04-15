import type { Metadata } from "next";
import { Construction } from "lucide-react";

import { StatusBadge } from "~/components/unit/status-badge";

export const metadata: Metadata = {
  title: "Mapa Budynku",
};

export default function MapaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          M01
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Mapa Budynku</h1>
        <p className="text-muted-foreground mt-1">
          Widok wszystkich 739 jednostek z filtrami i statusami
        </p>
      </div>

      {/* Podgląd kolorów statusów */}
      <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Legenda statusów
        </h2>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="not_started" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="to_check" />
          <StatusBadge status="done" />
          <StatusBadge status="issue" />
        </div>
      </div>

      <div className="rounded-lg border border-dashed bg-card p-12 text-center shadow-sm">
        <Construction
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
          strokeWidth={1.5}
        />
        <p className="font-medium">Mapa Budynku — w budowie</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu pojawi się widok siatki jednostek z filtrowaniem
        </p>
      </div>
    </div>
  );
}
