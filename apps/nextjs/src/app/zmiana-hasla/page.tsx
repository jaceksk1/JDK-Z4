"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useSession } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

export default function ZmianaHaslaPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionLoading } = useSession();

  const { data: must } = useQuery({
    ...trpc.auth.myMustChangePassword.queryOptions(),
    enabled: !!session,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const change = useMutation(
    trpc.auth.changeMyPassword.mutationOptions({
      onSuccess: async () => {
        toast.success("Hasło zmienione");
        await queryClient.invalidateQueries({
          queryKey: trpc.auth.myMustChangePassword.queryKey(),
        });
        router.replace("/dashboard");
      },
      onError: (e) => {
        setError(e.message);
        toast.error(e.message);
      },
    }),
  );

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    router.replace("/login");
    return null;
  }

  const isForced = must?.mustChange === true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Powtórzone hasło nie zgadza się");
      return;
    }
    if (newPassword.length < 6) {
      setError("Nowe hasło musi mieć min. 6 znaków");
      return;
    }
    change.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Zmiana hasła</h1>
            <p className="text-xs text-muted-foreground">
              {session.user.name} ({session.user.username})
            </p>
          </div>
        </div>

        {isForced && (
          <div className="mb-4 rounded-sm border border-[var(--status-to-check)]/40 bg-[color-mix(in_srgb,var(--status-to-check)_8%,var(--card))] p-3 text-sm">
            Twoje konto wymaga zmiany hasła startowego. Po zmianie zostaniesz
            przekierowany do aplikacji.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Aktualne hasło
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nowe hasło (min. 6 znaków)
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Powtórz nowe hasło
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--status-issue)]">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              change.isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {change.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Zmień hasło
          </Button>
        </form>
      </div>
    </div>
  );
}
