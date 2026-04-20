"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface TaskFormProps {
  onSuccess: () => void;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");

  const { data: units } = useQuery({
    ...trpc.unit.list.queryOptions({ projectCode: "Z4" }),
    select: (data) =>
      data
        .filter((u) => {
          const q = unitSearch.toLowerCase();
          return (
            u.displayDesignator.toLowerCase().includes(q) ||
            u.designator.toLowerCase().includes(q)
          );
        })
        .slice(0, 10),
    enabled: showUnitPicker,
  });

  const { data: users } = useQuery(
    trpc.admin.listUsers.queryOptions(),
  );

  const selectedUnit = units?.find((u) => u.id === unitId);

  const createTask = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        toast.success("Zadanie utworzone");
        void queryClient.invalidateQueries({
          queryKey: trpc.task.pathKey(),
        });
        setTitle("");
        setDescription("");
        setUnitId(null);
        setUnitSearch("");
        setAssignedToId(null);
        setDueDate("");
        onSuccess();
      },
      onError: (err) => {
        toast.error("Nie udało się utworzyć zadania", {
          description: err.message,
        });
      },
    }),
  );

  const canSubmit = title.trim().length >= 2 && !createTask.isPending;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {/* Tytuł */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tytuł zadania
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="np. Podłączyć gniazdka w łazience"
          className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Opis */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Opis (opcjonalnie)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Dodatkowe szczegóły..."
          className="w-full resize-none rounded-sm border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Jednostka */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Jednostka (opcjonalnie)
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
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Przypisanie */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Przypisz do (opcjonalnie)
        </label>
        <select
          value={assignedToId ?? ""}
          onChange={(e) => setAssignedToId(e.target.value || null)}
          className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Nieprzypisane</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} {u.company ? `(${u.company})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Termin */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Termin (opcjonalnie)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Submit */}
      <button
        disabled={!canSubmit}
        onClick={() =>
          createTask.mutate({
            projectCode: "Z4",
            title: title.trim(),
            description: description.trim() || undefined,
            unitId: unitId ?? undefined,
            assignedToId: assignedToId ?? undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
          })
        }
        className={cn(
          "flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
          canSubmit
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed",
        )}
      >
        {createTask.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Utwórz zadanie
      </button>
    </div>
  );
}
