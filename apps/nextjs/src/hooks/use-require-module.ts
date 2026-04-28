"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

/**
 * Client-side guard — przekierowuje na /dashboard jeśli zalogowany user
 * nie ma dostępu do podanego modułu (chyba że jest adminem).
 * Sidebar już filtruje, ale to chroni bezpośrednie wpisanie URL.
 *
 * Zwraca { isLoading, hasAccess } żeby strony mogły renderować zaślepkę
 * dopóki nie wiemy.
 */
export function useRequireModule(
  moduleKey: "mapa" | "pliki" | "zadania" | "qa",
): { isLoading: boolean; hasAccess: boolean } {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const trpc = useTRPC();
  const { data: myModules, isPending: modulesPending } = useQuery({
    ...trpc.group.myModules.queryOptions(),
    enabled: !!session,
    staleTime: 5 * 60_000,
  });

  const isLoading = sessionPending || (!!session && modulesPending);
  const isAdmin = session?.user?.role === "admin";
  const hasAccess =
    isAdmin || (myModules?.includes(moduleKey) ?? false);

  useEffect(() => {
    if (isLoading) return;
    if (!session) return; // proxy przekieruje na /login
    if (!hasAccess) {
      router.replace("/dashboard");
    }
  }, [isLoading, session, hasAccess, router]);

  return { isLoading, hasAccess };
}
