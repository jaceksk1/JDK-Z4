"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Pencil,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const TZ = "Europe/Warsaw";

function formatTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(d));
}

/** Date → "HH:MM" w PL (do prefill formularzy). */
function timeForInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
    hourCycle: "h23",
  }).format(new Date(d));
}

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
  }).format(dt);
}

export function AttendanceWidget() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.attendance.myToday.queryOptions(),
  );

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: trpc.attendance.myToday.queryKey(),
    });

  const checkIn = useMutation(
    trpc.attendance.checkIn.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Obecność zarejestrowana");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const checkOut = useMutation(
    trpc.attendance.checkOut.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Wyjście zarejestrowane");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const setTimes = useMutation(
    trpc.attendance.setTimes.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Godziny zapisane");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const cancel = useMutation(
    trpc.attendance.cancel.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Rekord anulowany");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-5 w-24 animate-pulse rounded bg-muted mb-3" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const { today, yesterday, todayRecord, yesterdayRecord, yesterdayBlocking } =
    data;

  // Stan A: wczoraj zaczęte, brak wyjścia → blokada dziś
  if (yesterdayBlocking && yesterdayRecord) {
    return (
      <YesterdayCompletePrompt
        date={yesterday}
        checkedInAt={yesterdayRecord.checkedInAt}
        onSubmit={(checkInTime, checkOutTime) =>
          setTimes.mutate({
            date: yesterday,
            checkInTime,
            checkOutTime,
          })
        }
        onCancel={() => cancel.mutate({ date: yesterday })}
        pending={setTimes.isPending || cancel.isPending}
      />
    );
  }

  // Stan: dziś niezaznaczone → button "Jestem dziś"
  if (!todayRecord) {
    const yesterdayHours =
      yesterdayRecord?.hoursWorked === null ||
      yesterdayRecord?.hoursWorked === undefined
        ? null
        : Number(yesterdayRecord.hoursWorked);
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">
            Obecność — {formatDateLabel(today)}
          </h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Zarejestruj swoje przybycie na budowę.
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={() => checkIn.mutate({})}
          disabled={checkIn.isPending}
        >
          <LogIn className="h-4 w-4" />
          Jestem dziś
        </Button>
        {yesterdayHours !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Wczoraj: {formatTime(yesterdayRecord?.checkedInAt)} →{" "}
            {formatTime(yesterdayRecord?.checkedOutAt)} (
            {yesterdayHours.toFixed(2)}h) ✓
          </p>
        )}
      </div>
    );
  }

  // Stan B: dziś zaznaczone, jeszcze nie wyjście
  if (!todayRecord.checkedOutAt) {
    return (
      <DayInProgressPanel
        date={today}
        checkedInAt={todayRecord.checkedInAt}
        onCheckOut={() => checkOut.mutate({})}
        onSubmitTimes={(checkInTime, checkOutTime) =>
          setTimes.mutate({ date: today, checkInTime, checkOutTime })
        }
        pending={checkOut.isPending || setTimes.isPending}
      />
    );
  }

  // Stan C: zamknięte
  return (
    <DayClosedPanel
      date={today}
      hours={
        todayRecord.hoursWorked === null
          ? 0
          : Number(todayRecord.hoursWorked)
      }
      checkedInAt={todayRecord.checkedInAt}
      checkedOutAt={todayRecord.checkedOutAt}
      onUpdateTimes={(checkInTime, checkOutTime) =>
        setTimes.mutate({ date: today, checkInTime, checkOutTime })
      }
      pending={setTimes.isPending}
    />
  );
}

/* ── Stan A: uzupełnij wczoraj ── */

function YesterdayCompletePrompt({
  date,
  checkedInAt,
  onSubmit,
  onCancel,
  pending,
}: {
  date: string;
  checkedInAt: Date | string;
  onSubmit: (checkInTime: string, checkOutTime: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [inTime, setInTime] = useState(timeForInput(checkedInAt));
  const [outTime, setOutTime] = useState("16:00");

  return (
    <div className="rounded-lg border border-[var(--status-issue)]/40 bg-[color-mix(in_srgb,var(--status-issue)_8%,var(--card))] p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-[var(--status-issue)]" />
        <h2 className="text-base font-semibold tracking-tight">
          Uzupełnij obecność z {formatDateLabel(date)}
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Zarejestrowałeś przybycie o {formatTime(checkedInAt)}, ale nie
        wpisałeś godziny wyjścia. Uzupełnij obie godziny lub anuluj rekord
        jeśli nie byłeś.
      </p>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Wejście
          </label>
          <Input
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Wyjście
          </label>
          <Input
            type="time"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
          />
        </div>
      </div>
      <Button
        className="mb-2 w-full"
        onClick={() => onSubmit(inTime, outTime)}
        disabled={pending || !inTime || !outTime}
      >
        Zapisz godziny
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={onCancel}
        disabled={pending}
      >
        Nie byłem — anuluj rekord
      </Button>
    </div>
  );
}

/* ── Stan B: w toku ── */

function DayInProgressPanel({
  date,
  checkedInAt,
  onCheckOut,
  onSubmitTimes,
  pending,
}: {
  date: string;
  checkedInAt: Date | string;
  onCheckOut: () => void;
  onSubmitTimes: (checkInTime: string, checkOutTime: string) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [inTime, setInTime] = useState(timeForInput(checkedInAt));
  const [outTime, setOutTime] = useState("");

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--status-in-progress)]" />
        <h2 className="text-base font-semibold tracking-tight">
          Obecność — {formatDateLabel(date)}
        </h2>
      </div>
      <p className="mb-4 text-sm">
        Wszedłeś o{" "}
        <span className="font-mono font-semibold">
          {formatTime(checkedInAt)}
        </span>
        .
      </p>
      {!editing ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={onCheckOut} disabled={pending}>
            <LogOut className="h-4 w-4" />
            Wychodzę (teraz)
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            disabled={pending}
          >
            <Pencil className="h-4 w-4" />
            Wpisz godziny ręcznie
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Wejście
              </label>
              <Input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Wyjście
              </label>
              <Input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (!inTime || !outTime) return;
                onSubmitTimes(inTime, outTime);
                setEditing(false);
              }}
              disabled={pending || !inTime || !outTime}
            >
              Zapisz
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stan C: zamknięte ── */

function DayClosedPanel({
  date,
  hours,
  checkedInAt,
  checkedOutAt,
  onUpdateTimes,
  pending,
}: {
  date: string;
  hours: number;
  checkedInAt: Date | string;
  checkedOutAt: Date | string | null;
  onUpdateTimes: (checkInTime: string, checkOutTime: string) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [inTime, setInTime] = useState(timeForInput(checkedInAt));
  const [outTime, setOutTime] = useState(timeForInput(checkedOutAt));

  return (
    <div className="rounded-lg border border-[var(--status-done)]/40 bg-[color-mix(in_srgb,var(--status-done)_6%,var(--card))] p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[var(--status-done)]" />
        <h2 className="text-base font-semibold tracking-tight">
          Obecność — {formatDateLabel(date)}
        </h2>
      </div>
      <div className="mb-4">
        <p className="font-mono text-2xl font-bold tabular-nums">
          {formatTime(checkedInAt)} → {formatTime(checkedOutAt)}
        </p>
        <p className="text-xs text-muted-foreground">
          Czas pracy:{" "}
          <span className="font-mono font-semibold">{hours.toFixed(2)}h</span>
        </p>
      </div>
      {!editing ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          disabled={pending}
        >
          <Pencil className="h-4 w-4" />
          Edytuj godziny
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Wejście
              </label>
              <Input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Wyjście
              </label>
              <Input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (!inTime || !outTime) return;
                onUpdateTimes(inTime, outTime);
                setEditing(false);
              }}
              disabled={pending || !inTime || !outTime}
            >
              Zapisz
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
