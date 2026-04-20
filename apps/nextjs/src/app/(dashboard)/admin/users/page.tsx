"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Plus,
  Search,
  UserX,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";

import { CreateUserForm } from "~/components/admin/create-user-form";
import { EditUserSheet } from "~/components/admin/edit-user-sheet";
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

const ROLE_ORDER: Record<string, number> = {
  admin: 0,
  manager: 1,
  worker: 2,
};

type SortField = "name" | "company" | "role";
type SortDir = "asc" | "desc";

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    username: string | null;
    role: string | null;
    company: string | null;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const trpc = useTRPC();
  const { data: users, refetch, isLoading } = useQuery(
    trpc.admin.listUsers.queryOptions(),
  );

  // Unikalne firmy do filtra
  const companies = useMemo(() => {
    if (!users) return [];
    const set = new Set(
      users.map((u) => u.company).filter((c): c is string => !!c),
    );
    return Array.from(set).sort();
  }, [users]);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);

  // Filtrowanie + sortowanie
  const filtered = useMemo(() => {
    if (!users) return [];
    let result = [...users];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.username ?? "").toLowerCase().includes(q) ||
          (u.company ?? "").toLowerCase().includes(q),
      );
    }

    // Role filter
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Company filter
    if (companyFilter) {
      result = result.filter((u) => u.company === companyFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "pl");
          break;
        case "company":
          cmp = (a.company ?? "").localeCompare(b.company ?? "", "pl");
          break;
        case "role":
          cmp =
            (ROLE_ORDER[a.role ?? "worker"] ?? 9) -
            (ROLE_ORDER[b.role ?? "worker"] ?? 9);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [users, search, roleFilter, companyFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasActiveFilters = !!search || !!roleFilter || !!companyFilter;

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

      {/* Edit sheet */}
      <EditUserSheet
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />

      {/* Filtry */}
      {users && users.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtr roli */}
            <RolePills selected={roleFilter} onChange={setRoleFilter} users={users} />

            {/* Filtr firmy */}
            {companies.length > 0 && (
              <select
                value={companyFilter ?? ""}
                onChange={(e) =>
                  setCompanyFilter(e.target.value || null)
                }
                className={cn(
                  "rounded-sm border bg-background px-3 py-1.5 text-xs font-medium transition-colors",
                  companyFilter
                    ? "border-primary text-primary"
                    : "text-muted-foreground",
                )}
              >
                <option value="">Wszystkie firmy</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter(null);
                  setCompanyFilter(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj..."
              className="w-full rounded-sm border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* Lista użytkowników */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <UserListSkeleton />
        ) : !users?.length ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Brak wyników dla wybranych filtrów
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <SortableHeader
                  label="Użytkownik"
                  field="name"
                  currentField={sortField}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Login
                </th>
                <SortableHeader
                  label="Firma"
                  field="company"
                  currentField={sortField}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
                <SortableHeader
                  label="Rola"
                  field="role"
                  currentField={sortField}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {u.username ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.company ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[u.role ?? "worker"] ?? ROLE_COLORS.worker}`}
                    >
                      {ROLE_LABELS[u.role ?? "worker"] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      aria-label="Edytuj"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Licznik */}
      {users && users.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {filtered.length} z {users.length} użytkowników
        </p>
      )}
    </div>
  );
}

/* ── Sortable header ── */

function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
  onToggle,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onToggle: (f: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
      <button
        onClick={() => onToggle(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

/* ── Role pills ── */

function RolePills({
  selected,
  onChange,
  users,
}: {
  selected: string | null;
  onChange: (role: string | null) => void;
  users: { role: string | null }[];
}) {
  const counts: Record<string, number> = {};
  for (const u of users) {
    const r = u.role ?? "worker";
    counts[r] = (counts[r] ?? 0) + 1;
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
          selected === null
            ? "bg-foreground text-background"
            : "bg-muted/50 text-muted-foreground hover:bg-muted",
        )}
      >
        Wszyscy
      </button>
      {(["admin", "manager", "worker"] as const).map((role) => {
        const isActive = selected === role;
        const count = counts[role] ?? 0;
        if (count === 0) return null;
        return (
          <button
            key={role}
            onClick={() => onChange(isActive ? null : role)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? ROLE_COLORS[role]
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {ROLE_LABELS[role]} ({count})
          </button>
        );
      })}
    </div>
  );
}

/* ── Skeleton & Empty ── */

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
