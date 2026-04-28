"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";

import { toast } from "@acme/ui/toast";

import { GroupMultiSelect } from "~/components/admin/group-multi-select";
import { useTRPC } from "~/trpc/react";

const ROLE_LABELS = {
  admin: "Administrator",
  manager: "Kierownik",
  worker: "Pracownik",
} as const;

type Role = keyof typeof ROLE_LABELS;

/** Jan Kowalski → jan.kowalski (bez polskich znaków) */
function toPreviewUsername(firstName: string, lastName: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (c) =>
        ({ ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" })[c] ?? c,
      )
      .replace(/[^a-z0-9]/g, "");
  return `${normalize(firstName)}.${normalize(lastName)}`;
}

export function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("worker");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const trpc = useTRPC();
  const createUser = useMutation(
    trpc.admin.createUser.mutationOptions({
      onSuccess: (user) => {
        toast.success(`Utworzono użytkownika ${user.username}`, {
          description: `${user.name} • ${ROLE_LABELS[user.role as Role]}`,
        });
        setFirstName("");
        setLastName("");
        setPassword("");
        setRole("worker");
        setCompany("");
        setGroupIds([]);
        onSuccess();
      },
      onError: (err) => {
        toast.error("Nie udało się utworzyć użytkownika", {
          description: err.message,
        });
      },
    }),
  );

  const previewUsername =
    firstName && lastName ? toPreviewUsername(firstName, lastName) : "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (groupIds.length === 0) {
      toast.error("Wybierz przynajmniej jedną grupę");
      return;
    }
    createUser.mutate({
      firstName,
      lastName,
      role,
      company: company || undefined,
      password,
      groupIds,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Imię</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jan"
            required
            className="rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nazwisko</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Kowalski"
            required
            className="rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>

      {previewUsername && (
        <p className="text-xs text-muted-foreground">
          Login:{" "}
          <span className="font-mono font-medium text-foreground">
            {previewUsername}
          </span>
        </p>
      )}

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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Grupy uprawnień <span className="text-destructive">*</span>
        </label>
        <GroupMultiSelect value={groupIds} onChange={setGroupIds} />
        <p className="text-xs text-muted-foreground">
          Określa które moduły będzie widzieć użytkownik. Wymagana min. 1 grupa.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Hasło startowe</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="min. 4 znaki"
          required
          minLength={4}
          className="rounded-sm border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        />
        <p className="text-xs text-muted-foreground">
          Pracownik powinien zmienić hasło po pierwszym logowaniu.
        </p>
      </div>

      <button
        type="submit"
        disabled={createUser.isPending}
        className="flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {createUser.isPending ? (
          "Tworzenie…"
        ) : (
          <>
            <UserPlus className="h-4 w-4" strokeWidth={2} />
            Utwórz użytkownika
          </>
        )}
      </button>
    </form>
  );
}
