"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  HardHat,
  ListChecks,
  MessageSquare,
  MessageSquarePlus,
  TrendingUp,
} from "lucide-react";

import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

export default function DashboardPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.dashboard.stats.queryOptions(),
  );

  // Automatycznie oznacz Q&A jako przeczytane po wejściu na dashboard
  const markSeen = useMutation(
    trpc.dashboard.markQaSeen.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.dashboard.stats.queryKey(),
        });
      },
    }),
  );

  useEffect(() => {
    if (data && data.unreadCount > 0) {
      markSeen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.unreadCount]);

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          Zaspa IV Gdańsk
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Powiadomienia */}
      {data.unreadCount > 0 && (
        <Link
          href="/qa"
          className="mb-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {data.role === "manager"
                ? `${data.unreadCount} ${data.unreadCount === 1 ? "nowe pytanie" : data.unreadCount < 5 ? "nowe pytania" : "nowych pytań"} czeka na odpowiedź`
                : `${data.unreadCount} ${data.unreadCount === 1 ? "nowa odpowiedź" : data.unreadCount < 5 ? "nowe odpowiedzi" : "nowych odpowiedzi"} na Twoje pytania`}
            </p>
            <p className="text-xs text-muted-foreground">
              Kliknij aby przejść do Q&A
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {/* Kafelki statystyk */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label={data.role === "manager" ? "Do odpowiedzenia" : "Moje pytania"}
          value={data.myCount}
          icon={
            data.role === "manager" ? (
              <MessageSquarePlus className="h-4 w-4" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )
          }
          href="/qa"
          accent="primary"
        />
        <StatCard
          label="Otwarte pytania"
          value={data.qa.open}
          icon={<Clock className="h-4 w-4" />}
          href="/qa?status=open"
          accent="to-check"
        />
        <StatCard
          label="Odpowiedziane"
          value={data.qa.answered}
          icon={<CheckCircle2 className="h-4 w-4" />}
          href="/qa?status=answered"
          accent="done"
        />
        <StatCard
          label="Zamknięte"
          value={data.qa.resolved}
          icon={<CheckCircle2 className="h-4 w-4" />}
          href="/qa?status=resolved"
          accent="not-started"
        />
      </div>

      {/* Zadania */}
      {data.tasks.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <StatCard
            label="Otwarte zadania"
            value={data.tasks.open}
            icon={<ClipboardList className="h-4 w-4" />}
            href="/zadania?status=open"
            accent="to-check"
          />
          <StatCard
            label="Zamknięte zadania"
            value={data.tasks.done}
            icon={<ListChecks className="h-4 w-4" />}
            href="/zadania?status=done"
            accent="done"
          />
          <StatCard
            label="Wszystkie zadania"
            value={data.tasks.total}
            icon={<ClipboardList className="h-4 w-4" />}
            href="/zadania"
            accent="primary"
          />
        </div>
      )}

      {/* Postęp budowy */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Postęp budowy
          </h2>
          <Link
            href="/mapa"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Mapa budynku
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold tabular-nums">
              {data.units.total > 0
                ? Math.round((data.units.done / data.units.total) * 100)
                : 0}
              %
            </span>
            <span className="text-xs text-muted-foreground">
              {data.units.done} / {data.units.total} jednostek
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--status-done)] transition-all"
              style={{
                width: `${data.units.total > 0 ? (data.units.done / data.units.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            label="Gotowe"
            value={data.units.done}
            cssVar="done"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          />
          <MiniStat
            label="W toku"
            value={data.units.inProgress}
            cssVar="in-progress"
            icon={<HardHat className="h-3.5 w-3.5" />}
          />
          <MiniStat
            label="Problemy"
            value={data.units.issue}
            cssVar="issue"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/qa"
          className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
        >
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">
              {data.role === "manager" ? "Odpowiedz na pytania" : "Zadaj pytanie"}
            </p>
            <p className="text-xs text-muted-foreground">
              Przejdź do modułu Q&A
            </p>
          </div>
        </Link>
        <Link
          href="/mapa"
          className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Przeglądaj mapę budynku</p>
            <p className="text-xs text-muted-foreground">
              Statusy jednostek i postęp
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ── Stat Card ── */

function StatCard({
  label,
  value,
  icon,
  href,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  accent: string;
}) {
  const isPrimary = accent === "primary";
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-4 shadow-xs transition-all hover:shadow-sm hover:border-primary/40"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-sm",
            isPrimary
              ? "bg-primary/15 text-primary"
              : "",
          )}
          style={
            !isPrimary
              ? {
                  backgroundColor: `color-mix(in srgb, var(--status-${accent}) 15%, transparent)`,
                  color: `var(--status-${accent})`,
                }
              : undefined
          }
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </Link>
  );
}

/* ── Mini Stat ── */

function MiniStat({
  label,
  value,
  cssVar,
  icon,
}: {
  label: string;
  value: number;
  cssVar: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm p-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-sm"
        style={{
          backgroundColor: `color-mix(in srgb, var(--status-${cssVar}) 15%, transparent)`,
          color: `var(--status-${cssVar})`,
        }}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Skeleton ── */

function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-3 w-24 animate-pulse rounded bg-muted mb-2" />
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted mb-3" />
            <div className="h-8 w-12 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-muted mb-4" />
        <div className="h-2.5 w-full animate-pulse rounded-full bg-muted mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
