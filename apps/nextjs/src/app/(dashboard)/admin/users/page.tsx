"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserX, X } from "lucide-react";

import { CreateUserForm } from "~/components/admin/create-user-form";
import { useTRPC } from "~/trpc/react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Kierownik",
  worker: "Pracownik",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  manager: "bg-[var(--status-in-progress)]/15 text-[var(--status-in-progress)]",
  worker: "bg-muted text-muted-foreground",
};

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);

  const trpc = useTRPC();
  const { data: users, refetch, isLoading } = useQuery(
    trpc.admin.listUsers.queryOptions(),
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            Administracja
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Użytkownicy</h1>
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
              Nowy użytkownik
            </>
          )}
        </button>
      </div>

      {/* Formularz */}
      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm max-w-md">
          <h2 className="mb-4 text-base font-medium">Nowy użytkownik</h2>
          <CreateUserForm
            onSuccess={() => {
              setShowForm(false);
              void refetch();
            }}
          />
        </div>
      )}

      {/* Lista użytkowników */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <UserListSkeleton />
        ) : !users?.length ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Użytkownik
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Login
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Rola
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {u.username ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[u.role ?? "worker"] ?? ROLE_COLORS.worker}`}
                    >
                      {ROLE_LABELS[u.role ?? "worker"] ?? u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UserListSkeleton() {
  return (
    <div className="p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3 border-b last:border-0"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <UserX className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-medium">Brak użytkowników</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Dodaj pierwszego użytkownika aby zacząć
        </p>
      </div>
      <button
        onClick={onAdd}
        className="mt-2 flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Dodaj użytkownika
      </button>
    </div>
  );
}
