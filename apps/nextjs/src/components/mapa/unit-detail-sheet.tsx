"use client";

import type { UnitStatus } from "@acme/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { StatusBadge } from "~/components/unit/status-badge";
import { useTRPC } from "~/trpc/react";

const TYPE_LABEL = {
  apartment: "Mieszkanie",
  commercial: "Lokal usługowy",
  parking: "Miejsce parkingowe",
  storage: "Komórka lokatorska",
} as const;

const STATUS_OPTIONS: { value: UnitStatus; label: string; cssVar: string }[] = [
  { value: "not_started", label: "Nie rozpoczęte", cssVar: "not-started" },
  { value: "in_progress", label: "W toku", cssVar: "in-progress" },
  { value: "to_check", label: "Do sprawdzenia", cssVar: "to-check" },
  { value: "done", label: "Gotowe", cssVar: "done" },
  { value: "issue", label: "Problem", cssVar: "issue" },
];

interface UnitDetailSheetProps {
  unitId: string | null;
  onClose: () => void;
}

export function UnitDetailSheet({ unitId, onClose }: UnitDetailSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: unit, isLoading } = useQuery({
    ...trpc.unit.getById.queryOptions({ id: unitId ?? "" }),
    enabled: !!unitId,
  });

  const updateStatus = useMutation(
    trpc.unit.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Status zmieniony");
        void queryClient.invalidateQueries({
          queryKey: trpc.unit.pathKey(),
        });
      },
      onError: (err) => {
        toast.error("Błąd zmiany statusu", { description: err.message });
      },
    }),
  );

  if (!unitId) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b p-5">
          <div>
            {isLoading ? (
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            ) : unit ? (
              <>
                <h2 className="font-mono text-xl font-bold tracking-tight">
                  {unit.designator}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {TYPE_LABEL[unit.type]}
                </p>
              </>
            ) : (
              <p className="text-sm text-destructive">Nie znaleziono</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {unit && (
            <>
              {/* Metadane */}
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Lokalizacja
                </h3>
                <dl className="space-y-1.5 text-sm">
                  {unit.buildingName && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Budynek</dt>
                      <dd className="font-medium">{unit.buildingName}</dd>
                    </div>
                  )}
                  {unit.sectionName && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Klatka</dt>
                      <dd className="font-medium">{unit.sectionName}</dd>
                    </div>
                  )}
                  {unit.floor && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Piętro</dt>
                      <dd className="font-medium">{unit.floor}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Status picker */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </h3>
                  <StatusBadge status={unit.status} />
                </div>
                <div className="space-y-1.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const isActive = unit.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        disabled={updateStatus.isPending || isActive}
                        onClick={() =>
                          updateStatus.mutate({
                            id: unit.id,
                            status: opt.value,
                          })
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-sm border p-3 text-left text-sm transition-all",
                          isActive
                            ? "border-primary bg-primary/5 cursor-default"
                            : "hover:border-foreground/30 hover:bg-accent",
                          updateStatus.isPending && "opacity-50",
                        )}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: `var(--status-${opt.cssVar})`,
                          }}
                        />
                        <span className="flex-1 font-medium">{opt.label}</span>
                        {isActive && (
                          <Check
                            className="h-4 w-4 text-primary"
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Notatki (read-only na razie) */}
              {unit.notes && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Notatki
                  </h3>
                  <p className="rounded-sm border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {unit.notes}
                  </p>
                </section>
              )}

              {/* Placeholdery dla kolejnych modułów */}
              <section className="rounded-sm border border-dashed p-4 text-center text-xs text-muted-foreground">
                Zadania (M03) i pytania (M08) pojawią się w kolejnych modułach
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
