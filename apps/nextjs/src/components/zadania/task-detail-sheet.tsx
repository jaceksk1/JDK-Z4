"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  ClipboardCheck,
  ImageIcon,
  Loader2,
  MapPin,
  RotateCcw,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";
import { toast } from "@acme/ui/toast";

import { useSession } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

const STATUS_CONFIG = {
  open: { label: "Otwarte", cssVar: "to-check" },
  submitted: { label: "Zgłoszone", cssVar: "in-progress" },
  done: { label: "Zamknięte", cssVar: "done" },
} as const;

interface TaskDetailSheetProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [completionNote, setCompletionNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: task, isLoading } = useQuery({
    ...trpc.task.getById.queryOptions({ id: taskId ?? "" }),
    enabled: !!taskId,
  });

  const submitMutation = useMutation(
    trpc.task.submit.mutationOptions({
      onSuccess: () => {
        toast.success("Wykonanie zgłoszone");
        void queryClient.invalidateQueries({
          queryKey: trpc.task.pathKey(),
        });
        setCompletionNote("");
        setPhotoFile(null);
        setPhotoPreview(null);
      },
      onError: (err) => {
        toast.error("Nie udało się zgłosić", { description: err.message });
      },
    }),
  );

  const statusMutation = useMutation(
    trpc.task.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Status zadania zmieniony");
        void queryClient.invalidateQueries({
          queryKey: trpc.task.pathKey(),
        });
      },
      onError: (err) => {
        toast.error("Błąd zmiany statusu", { description: err.message });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Zadanie usunięte");
        void queryClient.invalidateQueries({
          queryKey: trpc.task.pathKey(),
        });
        onClose();
      },
      onError: (err) => {
        toast.error("Nie udało się usunąć", { description: err.message });
      },
    }),
  );

  if (!taskId) return null;

  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isManager = userRole === "manager" || userRole === "admin";
  const isAssignedWorker = task?.assignedTo?.id === userId;
  const canSubmit = task?.status === "open" && (isAssignedWorker || isManager);
  const isOverdue =
    task?.status === "open" && task?.dueDate && new Date(task.dueDate) < new Date();

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

  const handleSubmit = async () => {
    if (!task || completionNote.trim().length < 2) return;
    setIsUploading(true);

    try {
      let photoPath: string | undefined;

      // Upload photo first if selected
      if (photoFile) {
        const userName = session?.user?.name?.replace(/\s+/g, "-").toLowerCase() ?? "user";
        const taskSlug = task.title
          .toLowerCase()
          .replace(/[ąćęłńóśźż]/g, (c) =>
            ({ ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" }[c] ?? c)
          )
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 30);
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("folder", `zadania/${userName}_${taskSlug}`);

        const uploadRes = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error ?? "Upload failed");
        }

        const uploadData = await uploadRes.json();
        photoPath = uploadData.path;
      }

      // Submit task completion
      submitMutation.mutate({
        taskId: task.id,
        completionNote: completionNote.trim(),
        completionPhotoPath: photoPath,
      });
    } catch (e: any) {
      toast.error("Błąd uploadu zdjęcia", { description: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || submitMutation.isPending;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b p-5">
          <div className="flex-1">
            {isLoading ? (
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            ) : task ? (
              <>
                <h2 className="text-lg font-bold tracking-tight leading-snug">
                  {task.title}
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--status-${STATUS_CONFIG[task.status].cssVar}) 15%, transparent)`,
                      color: `var(--status-${STATUS_CONFIG[task.status].cssVar})`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: `var(--status-${STATUS_CONFIG[task.status].cssVar})`,
                      }}
                    />
                    {STATUS_CONFIG[task.status].label}
                  </span>
                  {isOverdue && (
                    <span className="rounded-sm bg-[var(--status-issue)]/15 px-1.5 py-0.5 text-[11px] font-medium text-[var(--status-issue)]">
                      Po terminie
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-destructive">Nie znaleziono</p>
            )}
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
          {task && (
            <>
              {/* Opis */}
              {task.description && (
                <section>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </section>
              )}

              {/* Meta */}
              <section className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Zlecił: {task.createdBy.name}
                </span>
                {task.assignedTo && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Przypisany: {task.assignedTo.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(task.createdAt).toLocaleString("pl-PL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {task.unit && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono">
                      {task.unit.displayDesignator}
                    </span>
                  </span>
                )}
                {task.dueDate && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isOverdue && "text-[var(--status-issue)]",
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    Termin:{" "}
                    {new Date(task.dueDate).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </section>

              {/* Zgłoszenie wykonania — wyświetlone gdy submitted lub done */}
              {task.completionNote && (
                <section className="rounded-sm border-l-2 border-[var(--status-in-progress)] bg-[var(--status-in-progress)]/5 p-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--status-in-progress)]">
                    <ClipboardCheck className="mr-1 inline h-3 w-3" />
                    Zgłoszenie wykonania
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {task.completionNote}
                  </p>
                  {task.completionPhotoPath && (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/files?path=${encodeURIComponent(task.completionPhotoPath)}`}
                        alt="Zdjęcie wykonania"
                        className="w-full rounded-sm border object-cover max-h-64"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {task.submittedAt && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Zgłoszono:{" "}
                      {new Date(task.submittedAt).toLocaleString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </section>
              )}

              {/* Formularz zgłoszenia — worker (lub manager) gdy open */}
              {canSubmit && (
                <section className="border-t pt-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Zgłoś wykonanie
                  </h3>
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Opisz co zostało zrobione..."
                    className="w-full resize-none rounded-sm border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  {/* Photo upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  {photoPreview ? (
                    <div className="mt-2 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Podgląd zdjęcia"
                        className="w-full rounded-sm border object-cover max-h-40"
                      />
                      <button
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 flex items-center gap-2 rounded-sm border border-dashed px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors w-full justify-center"
                    >
                      <Camera className="h-4 w-4" />
                      Dodaj zdjęcie
                    </button>
                  )}

                  <button
                    disabled={completionNote.trim().length < 2 || isPending}
                    onClick={handleSubmit}
                    className={cn(
                      "mt-3 flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-all",
                      completionNote.trim().length >= 2 && !isPending
                        ? "bg-[var(--status-in-progress)] text-white hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isUploading ? "Wysyłanie zdjęcia..." : "Zgłoś wykonanie"}
                  </button>
                </section>
              )}

              {/* Akcje managera */}
              {isManager && (
                <section className="border-t pt-4 space-y-3">
                  {task.status === "submitted" && (
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          taskId: task.id,
                          status: "done",
                        })
                      }
                      className="flex items-center gap-2 rounded-sm bg-[var(--status-done)] px-4 py-2 text-sm font-medium text-[var(--status-done-fg)] hover:opacity-90 transition-all"
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Odbierz zadanie
                    </button>
                  )}

                  {task.status === "submitted" && (
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          taskId: task.id,
                          status: "open",
                        })
                      }
                      className="flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Cofnij do otwartych
                    </button>
                  )}

                  {task.status === "open" && (
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          taskId: task.id,
                          status: "done",
                        })
                      }
                      className="flex items-center gap-2 rounded-sm bg-[var(--status-done)] px-4 py-2 text-sm font-medium text-[var(--status-done-fg)] hover:opacity-90 transition-all"
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Zamknij zadanie
                    </button>
                  )}

                  {task.status === "done" && (
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          taskId: task.id,
                          status: "open",
                        })
                      }
                      className="flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Circle className="h-4 w-4" />
                      Otwórz ponownie
                    </button>
                  )}

                  <button
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Czy na pewno chcesz usunąć to zadanie?")) {
                        deleteMutation.mutate({ id: task.id });
                      }
                    }}
                    className="flex items-center gap-2 rounded-sm border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Usuń zadanie
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
