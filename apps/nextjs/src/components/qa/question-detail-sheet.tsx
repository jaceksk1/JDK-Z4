"use client";

import { useState } from "react";
import type { StageStatus } from "@acme/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Send,
  User,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useSession } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

const STATUS_CONFIG = {
  open: { label: "Otwarte", cssVar: "to-check" },
  answered: { label: "Odpowiedziane", cssVar: "done" },
  resolved: { label: "Zamknięte", cssVar: "not-started" },
} as const;

interface QuestionDetailSheetProps {
  questionId: string | null;
  onClose: () => void;
}

export function QuestionDetailSheet({
  questionId,
  onClose,
}: QuestionDetailSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [answerText, setAnswerText] = useState("");
  const [stagesToClear, setStagesToClear] = useState<Set<string>>(new Set());

  const { data: question, isLoading } = useQuery({
    ...trpc.question.getById.queryOptions({ id: questionId ?? "" }),
    enabled: !!questionId,
  });

  // Fetch issue stages for the linked unit
  const unitId = question?.unit?.id;
  const { data: stages } = useQuery({
    ...trpc.stage.getForUnit.queryOptions({ unitId: unitId ?? "" }),
    enabled: !!unitId,
  });
  const issueStages = stages?.filter((s) => s.status === "issue") ?? [];

  const toggleStageMutation = useMutation(
    trpc.stage.toggle.mutationOptions({
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.stage.pathKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.unit.pathKey(),
        });
      },
    }),
  );

  const answerMutation = useMutation(
    trpc.question.answer.mutationOptions({
      onSuccess: () => {
        toast.success("Odpowiedź wysłana");
        void queryClient.invalidateQueries({
          queryKey: trpc.question.pathKey(),
        });
        setAnswerText("");
      },
      onError: (err) => {
        toast.error("Błąd wysyłania odpowiedzi", {
          description: err.message,
        });
      },
    }),
  );

  const resolveMutation = useMutation(
    trpc.question.resolve.mutationOptions({
      onSuccess: () => {
        toast.success("Pytanie zamknięte");
        void queryClient.invalidateQueries({
          queryKey: trpc.question.pathKey(),
        });
      },
      onError: (err) => {
        toast.error("Nie udało się zamknąć pytania", {
          description: err.message,
        });
      },
    }),
  );

  if (!questionId) return null;

  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  const isManager = userRole === "manager" || userRole === "admin";
  const isAuthor = question?.askedBy.id === userId;
  const canAnswer = isManager && question?.status === "open";
  const canResolve =
    question?.status !== "resolved" && (isAuthor || isManager);

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
          <div className="flex-1">
            {isLoading ? (
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            ) : question ? (
              <>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight">Pytanie</h2>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--status-${STATUS_CONFIG[question.status].cssVar}) 15%, transparent)`,
                      color: `var(--status-${STATUS_CONFIG[question.status].cssVar})`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: `var(--status-${STATUS_CONFIG[question.status].cssVar})`,
                      }}
                    />
                    {STATUS_CONFIG[question.status].label}
                  </span>
                </div>
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
          {question && (
            <>
              {/* Pytanie */}
              <section>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.content}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {question.askedBy.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(question.createdAt).toLocaleString("pl-PL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {question.unit && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono">
                        {question.unit.displayDesignator}
                      </span>
                    </span>
                  )}
                </div>
              </section>

              {/* Odpowiedź */}
              {question.answer && (
                <section className="rounded-sm border-l-2 border-[var(--status-done)] bg-[var(--status-done)]/5 p-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--status-done)]">
                    Odpowiedź
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {question.answer}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {question.answeredBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {question.answeredBy.name}
                      </span>
                    )}
                    {question.answeredAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(question.answeredAt).toLocaleString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </section>
              )}

              {/* Formularz odpowiedzi (manager/admin, status open) */}
              {canAnswer && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Twoja odpowiedź
                  </h3>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={4}
                    maxLength={5000}
                    placeholder="Napisz odpowiedź..."
                    className="w-full resize-none rounded-sm border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    disabled={
                      answerText.trim().length < 1 ||
                      answerMutation.isPending
                    }
                    onClick={() =>
                      answerMutation.mutate({
                        questionId: question.id,
                        answer: answerText.trim(),
                      })
                    }
                    className={cn(
                      "mt-2 flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
                      answerText.trim().length >= 1
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {answerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Odpowiedz
                  </button>
                </section>
              )}

              {/* Issue stages to clear */}
              {isManager && issueStages.length > 0 && (
                <section className="rounded-sm border border-red-500/20 bg-red-500/5 p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Problemy w etapach
                  </h3>
                  <div className="space-y-1.5">
                    {issueStages.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2.5 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={stagesToClear.has(s.id)}
                          onChange={(e) => {
                            const next = new Set(stagesToClear);
                            if (e.target.checked) next.add(s.id);
                            else next.delete(s.id);
                            setStagesToClear(next);
                          }}
                          className="h-4 w-4 rounded border-red-300 text-primary accent-primary"
                        />
                        <span>Usuń problem: <span className="font-medium">{s.templateName}</span></span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Resolve */}
              {canResolve && (
                <section className="border-t pt-4">
                  <button
                    disabled={resolveMutation.isPending || toggleStageMutation.isPending}
                    onClick={() => {
                      // Clear selected issue stages
                      for (const stageId of stagesToClear) {
                        toggleStageMutation.mutate({
                          unitStageId: stageId,
                          status: "pending",
                        });
                      }
                      resolveMutation.mutate({ questionId: question.id });
                    }}
                    className="flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {resolveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {stagesToClear.size > 0
                      ? "Zamknij pytanie i usuń problemy"
                      : "Zamknij pytanie"}
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
