import type { Metadata } from "next";
import { Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Q&A",
};

export default function QaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          M08
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Q&amp;A</h1>
        <p className="text-muted-foreground mt-1">
          Pytania techniczne i odpowiedzi kierownika
        </p>
      </div>
      <div className="rounded-lg border border-dashed bg-card p-12 text-center shadow-sm">
        <Construction
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
          strokeWidth={1.5}
        />
        <p className="font-medium">Moduł Q&amp;A — w budowie</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pojawi się w kolejnej iteracji
        </p>
      </div>
    </div>
  );
}
