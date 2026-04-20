"use client";

import type { QuestionStatus } from "@acme/validators";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareOff, Plus, Search, X } from "lucide-react";

import { QuestionCard } from "~/components/qa/question-card";
import { QuestionDetailSheet } from "~/components/qa/question-detail-sheet";
import { QuestionForm } from "~/components/qa/question-form";
import { StatusFilterQa } from "~/components/qa/status-filter-qa";
import { useTRPC } from "~/trpc/react";

export default function QaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();

  const statusFilter = searchParams.get("status") as QuestionStatus | null;
  const searchQuery = searchParams.get("search") ?? "";
  const questionId = searchParams.get("question");

  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.question.list.queryOptions({
      projectCode: "Z4",
      status: statusFilter ?? undefined,
      search: searchQuery || undefined,
    }),
  );

  const items = data?.items ?? [];

  // Counts per status (from unfiltered query)
  const { data: allData } = useQuery(
    trpc.question.list.queryOptions({ projectCode: "Z4", limit: 100 }),
  );
  const counts: Partial<Record<QuestionStatus, number>> = {};
  if (allData?.items) {
    for (const q of allData.items) {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    }
  }

  const setStatusParam = (status: QuestionStatus | null) => {
    const params = new URLSearchParams(searchParams);
    if (status) params.set("status", status);
    else params.delete("status");
    params.delete("search");
    router.push(`/qa?${params.toString()}`);
  };

  const setSearchParam = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    router.push(`/qa?${params.toString()}`);
  };

  const openQuestion = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("question", id);
    router.push(`/qa?${params.toString()}`);
  };

  const closeQuestion = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("question");
    router.push(`/qa?${params.toString()}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            Moduł M08
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Q&A</h1>
        </div>
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
              Nowe pytanie
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 max-w-lg">
          <QuestionForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterQa
          selected={statusFilter}
          onChange={setStatusParam}
          counts={counts}
        />

        {/* Search */}
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
            placeholder="Szukaj w pytaniach..."
            className="w-full rounded-sm border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Questions list */}
      {isLoading ? (
        <QuestionListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          hasFilter={!!statusFilter || !!searchQuery}
          onClear={() => router.push("/qa")}
          onAdd={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-2">
          {items.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              content={q.content}
              status={q.status}
              askedByName={q.askedBy.name}
              createdAt={q.createdAt}
              unitDesignator={q.unit?.displayDesignator}
              hasAnswer={!!q.answer}
              onClick={() => openQuestion(q.id)}
              isActive={questionId === q.id}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <QuestionDetailSheet
        questionId={questionId}
        onClose={closeQuestion}
      />
    </div>
  );
}

function QuestionListSkeleton() {
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
          <div className="mt-1 h-4 w-1/2 animate-pulse rounded bg-muted" />
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
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MessageSquareOff
          className="h-6 w-6 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      <div>
        <p className="font-medium">
          {hasFilter ? "Brak pytań z tym filtrem" : "Brak pytań"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilter
            ? "Zmień filtr lub wyczyść wyszukiwanie"
            : "Zadaj pierwsze pytanie aby zacząć"}
        </p>
      </div>
      {hasFilter ? (
        <button
          onClick={onClear}
          className="mt-2 rounded-sm bg-muted px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Wyczyść filtry
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="mt-2 flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Zadaj pytanie
        </button>
      )}
    </div>
  );
}
