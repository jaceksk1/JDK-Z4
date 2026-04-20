"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, KeyRound, Trash2, X } from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const ROLE_LABELS = {
  admin: "Administrator",
  manager: "Kierownik",
  worker: "Pracownik",
} as const;

type Role = keyof typeof ROLE_LABELS;

interface UserData {
  id: string;
  name: string;
  username: string | null;
  role: string | null;
  company: string | null;
}

interface EditUserSheetProps {
  user: UserData | null;
  onClose: () => void;
}

export function EditUserSheet({ user, onClose }: EditUserSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("worker");
  const [company, setCompany] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole((user.role as Role) ?? "worker");
      setCompany(user.company ?? "");
      setNewPassword("");
      setShowPasswordReset(false);
      setConfirmDelete(false);
    }
  }, [user]);

  const updateMutation = useMutation(
    trpc.admin.updateUser.mutationOptions({
      onSuccess: () => {
        toast.success("Dane użytkownika zaktualizowane");
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.listUsers.queryKey(),
        });
        onClose();
      },
      onError: (err) => {
        toast.error("Nie udało się zaktualizować", {
          description: err.message,
        });
      },
    }),
  );

  const resetPasswordMutation = useMutation(
    trpc.admin.resetPassword.mutationOptions({
      onSuccess: () => {
        toast.success("Hasło zostało zmienione");
        setNewPassword("");
        setShowPasswordReset(false);
      },
      onError: (err) => {
        toast.error("Nie udało się zmienić hasła", {
          description: err.message,
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.admin.deleteUser.mutationOptions({
      onSuccess: () => {
        toast.success("Użytkownik usunięty");
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.listUsers.queryKey(),
        });
        onClose();
      },
      onError: (err) => {
        toast.error("Nie udało się usunąć", {
          description: err.message,
        });
      },
    }),
  );

  if (!user) return null;

  const canSave = name.trim().length >= 2 && !updateMutation.isPending;
  const canResetPassword =
    newPassword.length >= 4 && !resetPasswordMutation.isPending;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Edycja użytkownika
            </h2>
            <p className="mt-0.5 text-xs font-mono text-muted-foreground">
              {user.username}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Dane podstawowe */}
          <section className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Imię i nazwisko</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Rola</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Firma</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="np. JDK Elektro"
                className="rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>

            <button
              disabled={!canSave}
              onClick={() =>
                updateMutation.mutate({
                  userId: user.id,
                  name: name.trim(),
                  role,
                  company: company || undefined,
                })
              }
              className={cn(
                "flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
                canSave
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Zapisz zmiany
            </button>
          </section>

          {/* Reset hasła & Usuwanie */}
          <section className="border-t pt-5 space-y-5">
            {!showPasswordReset ? (
              <button
                onClick={() => setShowPasswordReset(true)}
                className="flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                Resetuj hasło
              </button>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium">Nowe hasło</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="min. 4 znaki"
                  minLength={4}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <div className="flex gap-2">
                  <button
                    disabled={!canResetPassword}
                    onClick={() =>
                      resetPasswordMutation.mutate({
                        userId: user.id,
                        newPassword,
                      })
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
                      canResetPassword
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {resetPasswordMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Zmień hasło
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword("");
                    }}
                    className="rounded-sm px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            )}

            {/* Usuń użytkownika */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-sm border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Usuń użytkownika
              </button>
            ) : (
              <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Czy na pewno chcesz usunąć {user.name}?
                </p>
                <p className="text-xs text-muted-foreground">
                  Tej operacji nie można cofnąć. Pytania zadane przez tego użytkownika zostaną usunięte.
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={deleteMutation.isPending}
                    onClick={() =>
                      deleteMutation.mutate({ userId: user.id })
                    }
                    className="flex items-center gap-2 rounded-sm bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-opacity"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Tak, usuń
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-sm px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
