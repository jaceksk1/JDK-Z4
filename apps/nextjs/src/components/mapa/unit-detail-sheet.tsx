"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StageStatus } from "@acme/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { StatusBadge } from "~/components/unit/status-badge";
import { useTRPC } from "~/trpc/react";

const LU_PDF_NAS_PATH =
  "/JDK/JDK-Z4/Projekt/08 Karty Katalogowe/5. KARTY INSTALACYJNE LU/PDF";

const TYPE_LABEL = {
  apartment: "Mieszkanie",
  commercial: "Lokal usługowy",
  parking: "Miejsce parkingowe",
  storage: "Komórka lokatorska",
} as const;

interface UnitDetailSheetProps {
  unitId: string | null;
  onClose: () => void;
}

export function UnitDetailSheet({ unitId, onClose }: UnitDetailSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: unit, isLoading } = useQuery({
    ...trpc.unit.getById.queryOptions({ id: unitId ?? "" }),
    enabled: !!unitId,
  });

  const { data: stages } = useQuery({
    ...trpc.stage.getForUnit.queryOptions({ unitId: unitId ?? "" }),
    enabled: !!unitId,
  });

  const stageQueryKey = trpc.stage.getForUnit.queryOptions({
    unitId: unitId ?? "",
  }).queryKey;

  const toggleStage = useMutation(
    trpc.stage.toggle.mutationOptions({
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: stageQueryKey });
        const prev = queryClient.getQueryData(stageQueryKey);
        queryClient.setQueryData(stageQueryKey, (old: typeof stages) =>
          old?.map((s) =>
            s.id === vars.unitStageId ? { ...s, status: vars.status } : s,
          ),
        );
        return { prev };
      },
      onError: (err, _vars, context) => {
        if (context?.prev) queryClient.setQueryData(stageQueryKey, context.prev);
        toast.error("Błąd zmiany etapu", { description: err.message });
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: stageQueryKey });
        void queryClient.invalidateQueries({
          queryKey: trpc.unit.pathKey(),
        });
      },
    }),
  );

  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    setPdfError(false);
  }, [unitId]);

  const hasFloorPlan = unit?.type === "commercial" && unit?.designator;
  const pdfUrl = hasFloorPlan
    ? `/api/files?path=${encodeURIComponent(`${LU_PDF_NAS_PATH}/ZAS4_MM_AR_INST_${unit.designator}.pdf`)}`
    : null;

  if (!unitId) return null;

  const doneCount = stages?.filter((s) => s.status === "done").length ?? 0;
  const totalCount = stages?.length ?? 0;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  function handleToggle(stageId: string, currentStatus: StageStatus) {
    const nextStatus: StageStatus =
      currentStatus === "done" ? "pending" : "done";
    toggleStage.mutate({ unitStageId: stageId, status: nextStatus });
  }

  function handleIssue(stageId: string, stageName: string) {
    if (!unit) return;
    // Mark stage as issue
    toggleStage.mutate({ unitStageId: stageId, status: "issue" });
    // Redirect to Q&A with prefill
    const prefill = `[${unit.displayDesignator}] ${stageName} — `;
    const params = new URLSearchParams({
      unitId: unit.id,
      prefill,
    });
    router.push(`/qa?${params.toString()}`);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — full width when PDF, narrow otherwise */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex border-l bg-card shadow-2xl",
          pdfUrl && !pdfError ? "w-full" : "w-full max-w-md",
        )}
      >
        {/* PDF panel (left side, takes all remaining space) — only for LU */}
        {pdfUrl && !pdfError && (
          <div className="hidden md:flex flex-1 min-w-0 flex-col border-r bg-muted/20">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Karta instalacyjna
              </span>
            </div>
            <iframe
              src={pdfUrl}
              className="flex-1"
              title={`Karta instalacyjna ${unit?.displayDesignator}`}
              onError={() => setPdfError(true)}
            />
          </div>
        )}

        {/* Detail panel (right side) — fixed width when PDF visible */}
        <div
          className={cn(
            "flex flex-col",
            pdfUrl && !pdfError
              ? "w-full max-w-md shrink-0"
              : "flex-1",
          )}
        >
          <header className="flex items-start justify-between border-b p-5">
            <div>
              {isLoading ? (
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              ) : unit ? (
                <>
                  <h2 className="font-mono text-xl font-bold tracking-tight">
                    {unit.displayDesignator}
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
                {/* PDF link for mobile (no split view) */}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-sm border p-3 text-sm hover:bg-accent transition-colors md:hidden"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      Otwórz kartę instalacyjną
                    </span>
                  </a>
                )}

                {/* Lokalizacja */}
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
                    {unit.floorLabel && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Piętro</dt>
                        <dd className="font-medium">{unit.floorLabel}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                {/* Status — auto-derived from stages */}
                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </h3>
                    <StatusBadge status={unit.status} />
                  </div>
                </section>

                {/* Etapy — checklista z progress bar */}
                {stages && stages.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Etapy — {doneCount}/{totalCount}
                    </h3>

                    {/* Progress bar */}
                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Stage list */}
                    <div className="space-y-1">
                      {stages.map((stage) => (
                        <div
                          key={stage.id}
                          className={cn(
                            "flex items-center gap-3 rounded-sm border p-3 transition-all",
                            stage.status === "done" &&
                              "border-green-500/30 bg-green-500/5",
                            stage.status === "issue" &&
                              "border-red-500/30 bg-red-500/5",
                            stage.status === "pending" &&
                              "hover:border-foreground/30 hover:bg-accent",
                          )}
                        >
                          {/* Toggle checkbox */}
                          <button
                            onClick={() => handleToggle(stage.id, stage.status)}
                            disabled={toggleStage.isPending}
                            className="shrink-0"
                            aria-label={
                              stage.status === "done"
                                ? "Oznacz jako niewykonane"
                                : "Oznacz jako wykonane"
                            }
                          >
                            {stage.status === "done" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : stage.status === "issue" ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>

                          {/* Stage name */}
                          <span
                            className={cn(
                              "flex-1 text-sm font-medium",
                              stage.status === "done" &&
                                "text-muted-foreground line-through",
                            )}
                          >
                            {stage.templateName}
                          </span>

                          {/* Report issue → Q&A */}
                          <button
                            onClick={() => handleIssue(stage.id, stage.templateName)}
                            className="shrink-0 rounded-sm p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                            aria-label="Zgłoś problem w Q&A"
                            title="Zgłoś problem w Q&A"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Stage notes */}
                    {stages.some((s) => s.notes) && (
                      <div className="mt-3 space-y-1.5">
                        {stages
                          .filter((s) => s.notes)
                          .map((s) => (
                            <div
                              key={s.id}
                              className="rounded-sm border bg-muted/30 px-3 py-2 text-xs"
                            >
                              <span className="font-medium">
                                {s.templateName}:
                              </span>{" "}
                              {s.notes}
                            </div>
                          ))}
                      </div>
                    )}
                  </section>
                )}

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
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
