"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  FileText,
  FolderSearch,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { FilePickerDialog } from "~/components/zadania/file-picker-dialog";
import { useTRPC } from "~/trpc/react";

interface TaskFormProps {
  onSuccess: () => void;
}

interface SelectedFile {
  path: string;
  name: string;
  description: string | null;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");

  // Zdjęcie managera
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Powiązany plik z modułu Projekt
  const [linkedFile, setLinkedFile] = useState<SelectedFile | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const { data: units } = useQuery({
    ...trpc.unit.list.queryOptions({ projectCode: "Z4" }),
    select: (data) =>
      data
        .filter((u) => {
          const q = unitSearch.toLowerCase();
          return (
            u.displayDesignator.toLowerCase().includes(q) ||
            u.designator.toLowerCase().includes(q)
          );
        })
        .slice(0, 10),
    enabled: showUnitPicker,
  });

  const { data: users } = useQuery(trpc.admin.listUsers.queryOptions());

  const selectedUnit = units?.find((u) => u.id === unitId);

  const createTask = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        toast.success("Zadanie utworzone");
        void queryClient.invalidateQueries({
          queryKey: trpc.task.pathKey(),
        });
        // Reset form
        setTitle("");
        setDescription("");
        setUnitId(null);
        setUnitSearch("");
        setAssignedToId(null);
        setDueDate("");
        setPhotoFile(null);
        setPhotoPreview(null);
        setLinkedFile(null);
        if (photoInputRef.current) photoInputRef.current.value = "";
        onSuccess();
      },
      onError: (err) => {
        toast.error("Nie udało się utworzyć zadania", {
          description: err.message,
        });
      },
    }),
  );

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Wybierz plik graficzny (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Zdjęcie za duże. Maksymalnie 10MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const slugifyTitle = (s: string) =>
    s
      .toLowerCase()
      .replace(
        /[ąćęłńóśźż]/g,
        (c) =>
          ({
            ą: "a",
            ć: "c",
            ę: "e",
            ł: "l",
            ń: "n",
            ó: "o",
            ś: "s",
            ź: "z",
            ż: "z",
          })[c] ?? c,
      )
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

  const handleSubmit = async () => {
    if (title.trim().length < 2) return;
    setIsUploading(true);

    try {
      let photoPath: string | undefined;

      // Upload zdjęcia (jeśli wybrane) — folder: zadania/{titleSlug}-creation
      if (photoFile) {
        const slug = slugifyTitle(title.trim()) || "task";
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("folder", `Zadania/${slug}-creation`);

        const uploadRes = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = (await uploadRes.json()) as { error?: string };
          throw new Error(err.error ?? "Upload failed");
        }

        const uploadData = (await uploadRes.json()) as { path: string };
        photoPath = uploadData.path;
      }

      createTask.mutate({
        projectCode: "Z4",
        title: title.trim(),
        description: description.trim() || undefined,
        unitId: unitId ?? undefined,
        assignedToId: assignedToId ?? undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        creationPhotoPath: photoPath,
        linkedFilePath: linkedFile?.path,
      });
    } catch (e) {
      toast.error("Błąd uploadu zdjęcia", {
        description: e instanceof Error ? e.message : "unknown",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const canSubmit =
    title.trim().length >= 2 && !createTask.isPending && !isUploading;

  return (
    <>
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        {/* Tytuł */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tytuł zadania
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="np. Podłączyć gniazdka w łazience"
            className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Opis */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Opis (opcjonalnie)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Dodatkowe szczegóły..."
            className="w-full resize-none rounded-sm border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Jednostka */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Jednostka (opcjonalnie)
          </label>
          {unitId && selectedUnit ? (
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-muted px-2 py-1 font-mono text-sm">
                {selectedUnit.displayDesignator}
              </span>
              <button
                onClick={() => {
                  setUnitId(null);
                  setUnitSearch("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Usuń
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={unitSearch}
                onChange={(e) => {
                  setUnitSearch(e.target.value);
                  setShowUnitPicker(true);
                }}
                onFocus={() => setShowUnitPicker(true)}
                placeholder="Szukaj po oznaczeniu np. A1.2.5"
                className="w-full rounded-sm border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {showUnitPicker && unitSearch.length > 0 && units && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-sm border bg-card shadow-lg">
                  {units.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">
                      Nie znaleziono
                    </p>
                  ) : (
                    units.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setUnitId(u.id);
                          setUnitSearch("");
                          setShowUnitPicker(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span className="font-mono font-medium">
                          {u.displayDesignator}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przypisanie */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Przypisz do (opcjonalnie)
          </label>
          <select
            value={assignedToId ?? ""}
            onChange={(e) => setAssignedToId(e.target.value || null)}
            className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Nieprzypisane</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.company ? `(${u.company})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Termin */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Termin (opcjonalnie)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Zdjęcie */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Zdjęcie (opcjonalnie)
          </label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Podgląd"
                className="max-h-40 w-full rounded-sm border object-cover"
              />
              <button
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              <Camera className="h-4 w-4" />
              Dodaj zdjęcie
            </button>
          )}
        </div>

        {/* Plik z modułu Projekt */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Powiązany plik z projektu (opcjonalnie)
          </label>
          {linkedFile ? (
            <div className="flex items-start gap-2 rounded-sm border bg-muted/30 p-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={linkedFile.name}>
                  {linkedFile.name}
                </p>
                {linkedFile.description && (
                  <p
                    className="truncate text-[11px] text-muted-foreground"
                    title={linkedFile.description}
                  >
                    {linkedFile.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setLinkedFile(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Usuń
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFilePicker(true)}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              <FolderSearch className="h-4 w-4" />
              Wybierz plik z projektu
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={cn(
            "flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
            canSubmit
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {createTask.isPending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isUploading ? "Wysyłanie zdjęcia..." : "Utwórz zadanie"}
        </button>
      </div>

      <FilePickerDialog
        open={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSelect={(params) => setLinkedFile(params)}
      />
    </>
  );
}
