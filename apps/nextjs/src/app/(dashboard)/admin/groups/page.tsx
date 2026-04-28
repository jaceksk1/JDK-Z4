"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { MODULES, type ModuleKey } from "@acme/validators";
import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  moduleKeys: string[];
  memberCount: number;
}

export default function AdminGroupsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [viewingMembers, setViewingMembers] = useState<GroupRow | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const groupsQuery = useQuery(trpc.group.list.queryOptions());

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grupy uprawnień</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Określają które moduły są widoczne dla członków. Admin zawsze widzi wszystko.
          </p>
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
              Nowa grupa
            </>
          )}
        </button>
      </div>

      {showForm && (
        <GroupForm
          onSuccess={() => {
            setShowForm(false);
            void queryClient.invalidateQueries({
              queryKey: trpc.group.list.queryKey(),
            });
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mt-6 rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h2 className="font-semibold text-sm">
            Grupy ({groupsQuery.data?.length ?? 0})
          </h2>
        </div>
        {groupsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Ładowanie…
          </div>
        ) : !groupsQuery.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Brak grup. Utwórz pierwszą.
          </div>
        ) : (
          <ul className="divide-y">
            {groupsQuery.data.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                onEdit={() => setEditing(g)}
                onViewMembers={() => setViewingMembers(g)}
              />
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <EditGroupSheet
          group={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            void queryClient.invalidateQueries({
              queryKey: trpc.group.list.queryKey(),
            });
          }}
        />
      )}

      {viewingMembers && (
        <MembersSheet
          group={viewingMembers}
          onClose={() => setViewingMembers(null)}
        />
      )}
    </div>
  );
}

function GroupRow({
  group,
  onEdit,
  onViewMembers,
}: {
  group: GroupRow;
  onEdit: () => void;
  onViewMembers: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(
    trpc.group.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.group.list.queryKey(),
        });
      },
      onError: (err) => alert(`Błąd: ${err.message}`),
    }),
  );

  return (
    <li className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="font-medium">{group.name}</div>
        {group.description && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {group.description}
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {group.moduleKeys.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic">
              brak modułów
            </span>
          ) : (
            group.moduleKeys.map((k) => (
              <span
                key={k}
                className="inline-flex rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary"
              >
                {MODULES.find((m) => m.key === k)?.label ?? k}
              </span>
            ))
          )}
        </div>
      </div>
      <button
        onClick={onViewMembers}
        className="flex items-center gap-1.5 rounded-sm border bg-background px-2 py-1 text-xs hover:bg-muted"
        title="Pokaż członków"
      >
        <Users className="h-3 w-3" />
        {group.memberCount}
      </button>
      <button
        onClick={onEdit}
        className="rounded-sm border bg-background p-1.5 hover:bg-muted"
        title="Edytuj"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          if (
            confirm(
              `Usunąć grupę "${group.name}"? ${group.memberCount > 0 ? `Ma ${group.memberCount} członków — operacja zablokuje się jeśli zostawiłaby kogoś bez grup.` : ""}`,
            )
          ) {
            deleteMutation.mutate({ groupId: group.id });
          }
        }}
        disabled={deleteMutation.isPending}
        className="rounded-sm border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
        title="Usuń"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function GroupForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: GroupRow;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [moduleKeys, setModuleKeys] = useState<Set<string>>(
    new Set(initial?.moduleKeys ?? []),
  );

  const trpc = useTRPC();
  const createMutation = useMutation(
    trpc.group.create.mutationOptions({
      onSuccess,
      onError: (err) => alert(`Błąd: ${err.message}`),
    }),
  );
  const updateMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess,
      onError: (err) => alert(`Błąd: ${err.message}`),
    }),
  );

  const isEdit = !!initial;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const toggleModule = (key: ModuleKey) => {
    setModuleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      moduleKeys: Array.from(moduleKeys),
    };
    if (isEdit && initial) {
      updateMutation.mutate({ ...payload, groupId: initial.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-5 shadow-sm space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Nazwa grupy</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Elektrycy budowy"
          className="w-full rounded-sm border bg-background px-3 py-2 text-sm"
          required
          minLength={2}
          maxLength={50}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Opis <span className="text-muted-foreground font-normal">(opcjonalny)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Krótki opis kogo dotyczy"
          className="w-full rounded-sm border bg-background px-3 py-2 text-sm"
          maxLength={500}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Moduły dostępne dla grupy</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => (
            <label
              key={m.key}
              className={cn(
                "flex items-start gap-2 rounded-sm border bg-background p-2.5 cursor-pointer transition-colors",
                moduleKeys.has(m.key) ? "border-primary bg-primary/5" : "hover:bg-muted",
              )}
            >
              <input
                type="checkbox"
                checked={moduleKeys.has(m.key)}
                onChange={() => toggleModule(m.key)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-[11px] text-muted-foreground">{m.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border bg-background px-3 py-2 text-sm hover:bg-muted"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isPending || name.trim().length < 2}
          className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {isEdit ? "Zapisz zmiany" : "Utwórz grupę"}
        </button>
      </div>
    </form>
  );
}

function EditGroupSheet({
  group,
  onClose,
  onSuccess,
}: {
  group: GroupRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-sidebar-border bg-background shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Edycja grupy</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <GroupForm
            initial={group}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        </div>
      </aside>
    </>
  );
}

function MembersSheet({
  group,
  onClose,
}: {
  group: GroupRow;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const membersQuery = useQuery(
    trpc.group.members.queryOptions({ groupId: group.id }),
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-sidebar-border bg-background shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Członkowie grupy</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{group.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="mb-3 text-xs text-muted-foreground">
            Edycja przynależności odbywa się w panelu /admin/users (formularz każdego użytkownika).
          </p>
          {membersQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Ładowanie…</div>
          ) : !membersQuery.data?.length ? (
            <div className="rounded-sm border border-dashed p-6 text-center text-sm text-muted-foreground">
              Brak członków
            </div>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {membersQuery.data.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {m.username}
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                    {m.role ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
