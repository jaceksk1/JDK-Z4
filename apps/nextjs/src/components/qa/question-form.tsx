"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Send } from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface QuestionFormProps {
  onSuccess: () => void;
  defaultUnitId?: string | null;
  defaultContent?: string | null;
}

export function QuestionForm({ onSuccess, defaultUnitId, defaultContent }: QuestionFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [content, setContent] = useState(defaultContent ?? "");
  const [unitId, setUnitId] = useState<string | null>(defaultUnitId ?? null);
  const [unitSearch, setUnitSearch] = useState("");
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const { data: allUnits } = useQuery({
    ...trpc.unit.list.queryOptions({ projectCode: "Z4" }),
    enabled: showUnitPicker || !!defaultUnitId,
  });

  const selectedUnit = allUnits?.find((u) => u.id === unitId);

  const units = allUnits
    ?.filter((u) => {
      const q = unitSearch.toLowerCase();
      return (
        u.displayDesignator.toLowerCase().includes(q) ||
        u.designator.toLowerCase().includes(q)
      );
    })
    .slice(0, 10);

  const createQuestion = useMutation(
    trpc.question.create.mutationOptions({
      onSuccess: () => {
        toast.success("Pytanie zostało zadane");
        void queryClient.invalidateQueries({
          queryKey: trpc.question.pathKey(),
        });
        setContent("");
        setUnitId(null);
        setUnitSearch("");
        onSuccess();
      },
      onError: (err) => {
        toast.error("Nie udało się zadać pytania", {
          description: err.message,
        });
      },
    }),
  );

  const canSubmit = content.trim().length >= 3 && !createQuestion.isPending;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {/* Unit picker */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Powiązana jednostka (opcjonalnie)
        </label>
        {unitId && selectedUnit ? (
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-muted px-2 py-1 font-mono text-sm">
              {selectedUnit.displayDesignator}
            </span>
            <button
              onClick={() => {
                setUnitId(null);
                setUnitSearch("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Usuń
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={unitSearch}
              onChange={(e) => {
                setUnitSearch(e.target.value);
                setShowUnitPicker(true);
              }}
              onFocus={() => setShowUnitPicker(true)}
              placeholder="Szukaj po oznaczeniu np. A1.2.5"
              className="w-full rounded-sm border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {showUnitPicker && unitSearch.length > 0 && units && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-sm border bg-card shadow-lg">
                {units.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">
                    Nie znaleziono
                  </p>
                ) : (
                  units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setUnitId(u.id);
                        setUnitSearch("");
                        setShowUnitPicker(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-mono font-medium">
                        {u.displayDesignator}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {u.type === "apartment"
                          ? "Mieszkanie"
                          : u.type === "commercial"
                            ? "LU"
                            : u.type === "parking"
                              ? "MP"
                              : "KL"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Treść pytania
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Opisz problem lub zadaj pytanie..."
          className="w-full resize-none rounded-sm border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {content.length}/2000
        </p>
      </div>

      {/* Submit */}
      <button
        disabled={!canSubmit}
        onClick={() =>
          createQuestion.mutate({
            projectCode: "Z4",
            content: content.trim(),
            unitId: unitId ?? undefined,
          })
        }
        className={cn(
          "flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
          canSubmit
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed",
        )}
      >
        {createQuestion.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Zadaj pytanie
      </button>
    </div>
  );
}
