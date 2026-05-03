"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

/**
 * Guard wymuszający zmianę hasła. Renderowany w layout (dashboard) — jeśli
 * zalogowany user ma flagę mustChangePassword=true, redirect na /zmiana-hasla.
 * Strona /zmiana-hasla jest poza (dashboard), więc nie powstaje pętla.
 */
export function MustChangePasswordGuard() {
  const router = useRouter();
  const { data: session } = useSession();
  const trpc = useTRPC();

  const { data } = useQuery({
    ...trpc.auth.myMustChangePassword.queryOptions(),
    enabled: !!session,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data?.mustChange) {
      router.replace("/zmiana-hasla");
    }
  }, [data?.mustChange, router]);

  return null;
}
