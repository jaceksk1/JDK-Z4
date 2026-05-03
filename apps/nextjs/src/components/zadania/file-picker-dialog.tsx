"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { FileBrowser } from "~/components/mapa/file-browser";

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (params: {
    path: string;
    name: string;
    description: string | null;
  }) => void;
  /** Etykieta nagłówka — domyślnie "Wybierz plik z projektu". */
  title?: string;
}

/**
 * Modal trzymający FileBrowser w trybie selektora.
 * Zachowuje własną ścieżkę nawigacji (state lokalny, nie URL) — po zamknięciu
 * wraca do roota przy następnym otwarciu (świadoma decyzja, mała pojemność).
 */
export function FilePickerDialog({
  open,
  onClose,
  onSelect,
  title = "Wybierz plik z projektu",
}: FilePickerDialogProps) {
  const [path, setPath] = useState("");

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 inset-y-8 z-50 flex flex-col rounded-lg border bg-card shadow-2xl md:inset-x-12 md:inset-y-12 lg:inset-x-24">
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <FileBrowser
            pathOverride={path}
            onPathChange={setPath}
            onSelect={(params) => {
              onSelect(params);
              onClose();
            }}
          />
        </div>
        <footer className="border-t p-3 text-center text-xs text-muted-foreground">
          Kliknij plik, aby go wybrać
        </footer>
      </div>
    </>
  );
}
