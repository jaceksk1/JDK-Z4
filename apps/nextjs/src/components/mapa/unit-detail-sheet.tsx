"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StageStatus } from "@acme/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
  Pencil,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useSession } from "~/auth/client";
import { StatusBadge } from "~/components/unit/status-badge";
import { useTRPC } from "~/trpc/react";

const APT_PDF_NAS_PATH =
  "/JDK/JDK-Z4/Projekt/08 Karty Katalogowe/2. KARTY INSTALACYJNE";

const TYPE_LABEL = {
  apartment: "Mieszkanie",
  commercial: "Lokal usługowy",
  parking: "Miejsce parkingowe",
  storage: "Komórka lokatorska",
} as const;

type CardTab = "karta" | "osw" | "gn";
const TAB_LABELS: Record<CardTab, string> = {
  karta: "Karta",
  osw: "Oświetlenie",
  gn: "Gniazda",
};

interface UnitDetailSheetProps {
  unitId: string | null;
  onClose: () => void;
}

export function UnitDetailSheet({ unitId, onClose }: UnitDetailSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const isManager =
    session?.user?.role === "manager" || session?.user?.role === "admin";

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

  const [activeTab, setActiveTab] = useState<CardTab>("karta");
  const [editingCard, setEditingCard] = useState(false);
  const [cardDraft, setCardDraft] = useState("");

  useEffect(() => {
    setActiveTab("karta");
    setEditingCard(false);
    setCardDraft("");
  }, [unitId]);

  const updateCardCode = useMutation(
    trpc.unit.updateCardCode.mutationOptions({
      onSuccess: () => {
        toast.success("Kod karty zapisany");
        setEditingCard(false);
        void queryClient.invalidateQueries({ queryKey: trpc.unit.pathKey() });
      },
      onError: (err) => toast.error("Błąd zapisu", { description: err.message }),
    }),
  );

  const buildingLetter = unit?.designator?.match(/^([AB])/)?.[1] ?? null;
  const hasCard =
    (unit?.type === "apartment" || unit?.type === "commercial") &&
    !!unit.cardCode &&
    !!buildingLetter;
  const pdfUrl = hasCard
    ? `/api/files?path=${encodeURIComponent(
        `${APT_PDF_NAS_PATH}/BUDYNEK ${buildingLetter}/PDF/${unit.cardCode}/${unit.cardCode}.${activeTab}.pdf`,
      )}`
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
          pdfUrl ? "w-full" : "w-full max-w-md",
        )}
      >
        {/* PDF panel z zakładkami (Karta / Oświetlenie / Gniazda) */}
        {pdfUrl && (
          <div className="hidden md:flex flex-1 min-w-0 flex-col border-r bg-muted/20">
            <div className="flex items-center gap-1 border-b px-3 py-2">
              <FileText className="h-4 w-4 text-muted-foreground mr-2" />
              {(["karta", "osw", "gn"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {unit?.cardCode}.{activeTab}.pdf
              </span>
            </div>
            <iframe
              key={pdfUrl}
              src={pdfUrl}
              className="flex-1"
              title={`${TAB_LABELS[activeTab]} ${unit?.cardCode}`}
            />
          </div>
        )}

        {/* Detail panel (right side) — fixed width when PDF visible */}
        <div
          className={cn(
            "flex flex-col",
            pdfUrl ? "w-full max-w-md shrink-0" : "flex-1",
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
                {/* PDF links for mobile (no split view) */}
                {hasCard && unit.cardCode && buildingLetter && (
                  <div className="flex flex-col gap-1.5 md:hidden">
                    {(["karta", "osw", "gn"] as const).map((tab) => (
                      <a
                        key={tab}
                        href={`/api/files?path=${encodeURIComponent(
                          `${APT_PDF_NAS_PATH}/BUDYNEK ${buildingLetter}/PDF/${unit.cardCode}/${unit.cardCode}.${tab}.pdf`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-sm border p-3 text-sm hover:bg-accent transition-colors"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{TAB_LABELS[tab]}</span>
                      </a>
                    ))}
                  </div>
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

                {/* Kod karty — mieszkania i lokale */}
                {(unit.type === "apartment" || unit.type === "commercial") && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Kod karty
                    </h3>
                    {editingCard ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cardDraft}
                          onChange={(e) => setCardDraft(e.target.value)}
                          placeholder="A1.1.5"
                          className="w-32 rounded-sm border bg-background px-2 py-1 font-mono text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            const v = cardDraft.trim();
                            const code = v ? v : null;
                            if (
                              code !== null &&
                              !/^[AB][12]\.(?:U|\d+)\.\d+$/.test(code)
                            ) {
                              toast.error("Format: A1.1.5 lub A1.U.1");
                              return;
                            }
                            updateCardCode.mutate({ id: unit.id, cardCode: code });
                          }}
                          disabled={updateCardCode.isPending}
                          className="rounded-sm bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          Zapisz
                        </button>
                        <button
                          onClick={() => setEditingCard(false)}
                          className="rounded-sm border px-3 py-1 text-xs hover:bg-accent"
                        >
                          Anuluj
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">
                          {unit.cardCode ? (
                            <span className="font-mono">{unit.cardCode}</span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              nieprzypisany
                            </span>
                          )}
                        </span>
                        {isManager && (
                          <button
                            onClick={() => {
                              setCardDraft(unit.cardCode ?? "");
                              setEditingCard(true);
                            }}
                            className="flex items-center gap-1 rounded-sm border px-2 py-1 text-xs hover:bg-accent"
                          >
                            <Pencil className="h-3 w-3" />
                            {unit.cardCode ? "Zmień" : "Przypisz"}
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                )}

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
