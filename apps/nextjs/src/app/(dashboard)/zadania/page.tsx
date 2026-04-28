"use client";

import type { TaskStatus } from "@acme/validators";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClipboardX, Plus, Search, X } from "lucide-react";

import { useSession } from "~/auth/client";
import { StatusFilterTasks } from "~/components/zadania/status-filter-tasks";
import { TaskCard } from "~/components/zadania/task-card";
import { TaskDetailSheet } from "~/components/zadania/task-detail-sheet";
import { TaskForm } from "~/components/zadania/task-form";
import { useTRPC } from "~/trpc/react";

export default function ZadaniaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session } = useSession();

  const statusFilter = searchParams.get("status") as TaskStatus | null;
  const searchQuery = searchParams.get("search") ?? "";
  const taskId = searchParams.get("task");

  const [showForm, setShowForm] = useState(false);

  const isManager =
    session?.user?.role === "manager" || session?.user?.role === "admin";

  const { data, isLoading } = useQuery(
    trpc.task.list.queryOptions({
      projectCode: "Z4",
      status: statusFilter ?? undefined,
      search: searchQuery || undefined,
    }),
  );

  const items = data?.items ?? [];

  // Counts per status
  const { data: allData } = useQuery(
    trpc.task.list.queryOptions({ projectCode: "Z4", limit: 100 }),
  );
  const counts: Partial<Record<TaskStatus, number>> = {};
  if (allData?.items) {
    for (const t of allData.items) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
  }

  const setStatusParam = (status: TaskStatus | null) => {
    const params = new URLSearchParams(searchParams);
    if (status) params.set("status", status);
    else params.delete("status");
    params.delete("search");
    router.push(`/zadania?${params.toString()}`);
  };

  const setSearchParam = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    router.push(`/zadania?${params.toString()}`);
  };

  const openTask = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("task", id);
    router.push(`/zadania?${params.toString()}`);
  };

  const closeTask = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("task");
    router.push(`/zadania?${params.toString()}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zadania</h1>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" strokeWidth={2} />
                Anuluj
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nowe zadanie
              </>
            )}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isManager && (
        <div className="mb-6 max-w-lg">
          <TaskForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterTasks
          selected={statusFilter}
          onChange={setStatusParam}
          counts={counts}
        />

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            defaultValue={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              const timeout = setTimeout(() => setSearchParam(val), 400);
              return () => clearTimeout(timeout);
            }}
            placeholder="Szukaj w zadaniach..."
            className="w-full rounded-sm border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <TaskListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          hasFilter={!!statusFilter || !!searchQuery}
          onClear={() => router.push("/zadania")}
          onAdd={isManager ? () => setShowForm(true) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <TaskCard
              key={t.id}
              id={t.id}
              title={t.title}
              status={t.status}
              createdByName={t.createdBy.name}
              assignedToName={t.assignedTo?.name ?? null}
              createdAt={t.createdAt}
              dueDate={t.dueDate}
              unitDesignator={t.unit?.displayDesignator}
              onClick={() => openTask(t.id)}
              isActive={taskId === t.id}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <TaskDetailSheet taskId={taskId} onClose={closeTask} />
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-sm border bg-card p-4"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: "var(--status-not-started)",
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilter,
  onClear,
  onAdd,
}: {
  hasFilter: boolean;
  onClear: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ClipboardX
          className="h-6 w-6 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      <div>
        <p className="font-medium">
          {hasFilter ? "Brak zadań z tym filtrem" : "Brak zadań"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilter
            ? "Zmień filtr lub wyczyść wyszukiwanie"
            : "Utwórz pierwsze zadanie aby zacząć"}
        </p>
      </div>
      {hasFilter ? (
        <button
          onClick={onClear}
          className="mt-2 rounded-sm bg-muted px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Wyczyść filtry
        </button>
      ) : onAdd ? (
        <button
          onClick={onAdd}
          className="mt-2 flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Utwórz zadanie
        </button>
      ) : null}
    </div>
  );
}
