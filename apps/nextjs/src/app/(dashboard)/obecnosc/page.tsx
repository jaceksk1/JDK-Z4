"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Pencil,
  XCircle,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useRequireModule } from "~/hooks/use-require-module";
import { useTRPC } from "~/trpc/react";

type Tab = "today" | "month" | "report";

const TZ = "Europe/Warsaw";

function todayPlString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

function formatPlDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function formatTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(d));
}

export default function ObecnoscPage() {
  const { hasAccess } = useRequireModule("obecnosc");
  const [tab, setTab] = useState<Tab>("today");

  if (!hasAccess) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          Zaspa IV Gdańsk
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Obecność</h1>
      </div>

      <div className="mb-6 flex gap-1 border-b">
        <TabButton active={tab === "today"} onClick={() => setTab("today")}>
          <CalendarDays className="h-4 w-4" /> Dziś
        </TabButton>
        <TabButton active={tab === "month"} onClick={() => setTab("month")}>
          <Clock className="h-4 w-4" /> Miesiąc
        </TabButton>
        <TabButton active={tab === "report"} onClick={() => setTab("report")}>
          <Download className="h-4 w-4" /> Raport CSV
        </TabButton>
      </div>

      {tab === "today" && <TodayTab />}
      {tab === "month" && <MonthTab />}
      {tab === "report" && <ReportTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px " +
        (active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

/* ── Tab: Dziś ─────────────────────────────────────────────────── */

function TodayTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string>(todayPlString());

  const { data, isLoading } = useQuery(
    trpc.attendance.listForDate.queryOptions({ date }),
  );

  const setTimes = useMutation(
    trpc.attendance.setTimes.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.attendance.listForDate.queryKey({ date }),
        });
        toast.success("Zapisano");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const present = (data ?? []).filter((r) => r.present).length;
  const total = data?.length ?? 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Data
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="ml-auto rounded-md border bg-card px-3 py-2 text-sm">
          <span className="font-mono font-bold text-foreground">{present}</span>
          <span className="text-muted-foreground"> / {total} obecnych</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak użytkowników.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Pracownik</th>
                <th className="px-3 py-2 font-medium">Firma</th>
                <th className="px-3 py-2 font-medium">Wejście</th>
                <th className="px-3 py-2 font-medium">Wyjście</th>
                <th className="px-3 py-2 font-medium">Godziny</th>
                <th className="px-3 py-2 font-medium">Notatka</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row) => (
                <tr key={row.userId} className="border-t">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {row.present ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--status-done)]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.company ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.present ? (
                      <TimeCell
                        time={row.checkedInAt}
                        onSave={(t) =>
                          setTimes.mutate({
                            date,
                            checkInTime: t,
                            userId: row.userId,
                          })
                        }
                        pending={setTimes.isPending}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.present ? (
                      <TimeCell
                        time={row.checkedOutAt}
                        onSave={(t) =>
                          setTimes.mutate({
                            date,
                            checkOutTime: t,
                            userId: row.userId,
                          })
                        }
                        pending={setTimes.isPending}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {row.hoursWorked === null
                      ? "—"
                      : `${row.hoursWorked.toFixed(2)}h`}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TimeCell({
  time,
  onSave,
  pending,
}: {
  time: Date | string | null;
  onSave: (time: string) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(timeForInput(time));

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="time"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="h-7 w-24 text-xs"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => {
            if (!val) return;
            onSave(val);
            setEditing(false);
          }}
          disabled={pending}
        >
          OK
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 rounded px-1 hover:bg-accent"
    >
      <span className="tabular-nums">{formatTime(time)}</span>
      <Pencil className="h-3 w-3 text-muted-foreground/50" />
    </button>
  );
}

function timeForInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
    hourCycle: "h23",
  }).format(new Date(d));
}

/* ── Tab: Miesiąc ───────────────────────────────────────────────── */

function MonthTab() {
  const trpc = useTRPC();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useQuery(
    trpc.attendance.monthlyReport.queryOptions({ year, month }),
  );

  const days = data ? Array.from({ length: data.daysInMonth }, (_, i) => i + 1) : [];

  return (
    <>
      <div className="mb-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Rok
          </label>
          <Input
            type="number"
            min="2024"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Miesiąc
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            {[
              "Styczeń",
              "Luty",
              "Marzec",
              "Kwiecień",
              "Maj",
              "Czerwiec",
              "Lipiec",
              "Sierpień",
              "Wrzesień",
              "Październik",
              "Listopad",
              "Grudzień",
            ].map((label, idx) => (
              <option key={label} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      ) : data.users.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Brak rejestrów obecności w tym miesiącu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="text-xs">
            <thead className="bg-muted/50 text-left uppercase text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 font-medium min-w-[180px]">
                  Pracownik
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="px-1 py-2 text-center font-medium tabular-nums w-9"
                  >
                    {d}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium tabular-nums">
                  Suma
                </th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const monthStr = String(month).padStart(2, "0");
                return (
                  <tr key={u.userId} className="border-t">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 min-w-[180px]">
                      <div className="font-medium">{u.name}</div>
                      {u.company && (
                        <div className="text-[10px] text-muted-foreground">
                          {u.company}
                        </div>
                      )}
                    </td>
                    {days.map((d) => {
                      const key = `${year}-${monthStr}-${String(d).padStart(2, "0")}`;
                      const cell = u.days[key];
                      return (
                        <td
                          key={d}
                          className="border-l px-1 py-2 text-center tabular-nums"
                          title={cell?.note ?? undefined}
                        >
                          {cell ? (
                            cell.hours === null ? (
                              <span className="text-[var(--status-to-check)]">·</span>
                            ) : (
                              <span className="text-[var(--status-done)]">
                                {cell.hours.toFixed(1)}
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-l bg-muted/20 px-3 py-2 text-right font-mono font-bold tabular-nums">
                      {u.totalHours.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ── Tab: Raport CSV ─────────────────────────────────────────────── */

function ReportTab() {
  const trpc = useTRPC();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Manualny query trigger przez fetch (TanStack `enabled: false` + refetch)
  const queryClient = useQueryClient();

  async function downloadCsv() {
    try {
      const data = await queryClient.fetchQuery(
        trpc.attendance.exportMonth.queryOptions({ year, month }),
      );
      const blob = new Blob([data.content], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Pobrano ${data.filename}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd eksportu");
    }
  }

  return (
    <div className="max-w-md">
      <p className="mb-4 text-sm text-muted-foreground">
        Generuje plik CSV (Excel-friendly: BOM UTF-8, separator ; ) z listą:
        pracownik, firma, data, godziny, notatka.
      </p>
      <div className="mb-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Rok
          </label>
          <Input
            type="number"
            min="2024"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Miesiąc
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            {[
              "Styczeń",
              "Luty",
              "Marzec",
              "Kwiecień",
              "Maj",
              "Czerwiec",
              "Lipiec",
              "Sierpień",
              "Wrzesień",
              "Październik",
              "Listopad",
              "Grudzień",
            ].map((label, idx) => (
              <option key={label} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={downloadCsv}>
        <Download className="h-4 w-4" />
        Pobierz CSV
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        {formatPlDate(`${year}-${String(month).padStart(2, "0")}-01`)} —
        cały miesiąc
      </p>
    </div>
  );
}
