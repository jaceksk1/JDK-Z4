"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  File,
  FileImage,
  FileText,
  Folder,
  Home,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

interface NasEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  mtime: number;
}

interface ListResponse {
  path: string;
  entries: NasEntry[];
}

async function fetchList(path: string): Promise<ListResponse> {
  const url = path
    ? `/api/files/list?path=${encodeURIComponent(path)}`
    : `/api/files/list`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Błąd ${res.status}`);
  }
  return res.json() as Promise<ListResponse>;
}

/**
 * Wyciąga kod rysunku z nazwy pliku.
 *
 * Format pliku: 9 segmentów prefiksu + numer rysunku + minor rewizji.
 *   "6295_01_PW_ELE_ROZ_XXX_X_SCH_XXX_07_01.pdf"
 *    └────────── prefix ──────────┘ │   │  │
 *                                 typ  num rev
 *
 * Wynik: 10 segmentów (prefix + numer rysunku):
 *   "6295_01_PW_ELE_ROZ_XXX_X_SCH_XXX_07"
 *
 * Numer rysunku jest w 10. segmencie (niezależnie od tego czy 9. to placeholder
 * XXX jak w schematach rozdzielnic, czy konkretne oznaczenie kondygnacji jak G01/P01
 * w rzutach). Minor rewizji (11. segment) jest pomijany.
 */
export function extractDrawingCode(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, "");
  const parts = base.split("_");
  if (parts.length < 11) return null;
  const typeSegment = parts[7];
  if (!/^[A-Z]{3}$/.test(typeSegment ?? "")) return null;
  const drawingNum = parts[9];
  if (!/^\d+$/.test(drawingNum ?? "")) return null;
  return parts.slice(0, 10).join("_");
}

/** Ostatni segment nazwy pliku (minor rewizji, np. "01" / "00"). */
function extractRevision(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, "");
  const parts = base.split("_");
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  return last && /^\d+$/.test(last) ? last : null;
}

/** Wyciąga 4. segment z nazwy (dyscyplina: ELE/TEL/SAN/...) */
function extractDiscipline(filename: string): string | null {
  const parts = filename.split("_");
  const seg = parts[3];
  return seg && /^[A-Z]{3}$/.test(seg) ? seg : null;
}

const FILTER_ALL = "__ALL__";

/**
 * Stałe kategorie tematyczne — matche wykonywane na lowercase opisu.
 * Plik trafia do kategorii jeśli ANY pattern się matchuje.
 */
interface TopicFilter {
  id: string;
  label: string;
  patterns: string[];
}

const TOPIC_FILTERS: TopicFilter[] = [
  { id: "bud_a", label: "Bud. A", patterns: ["budynek a", "bud. a", "bud.a"] },
  { id: "bud_b", label: "Bud. B", patterns: ["budynek b", "bud. b", "bud.b"] },
  { id: "oswietlenie", label: "Oświetlenie", patterns: ["oświetleni", "oswietleni"] },
  { id: "instalacje", label: "Instalacje", patterns: ["instalacj"] },
  {
    id: "schemat_rozdzielnicy",
    label: "Schemat rozdzielnicy",
    patterns: ["schemat rozdzielnic", "schemat tablic"],
  },
  {
    id: "widok_rozdzielnicy",
    label: "Widok rozdzielnicy",
    patterns: ["widok rozdzielnic", "widok tablic"],
  },
  {
    id: "odgromowa",
    label: "Instalacja odgromowa",
    patterns: ["odgromow"],
  },
  {
    id: "schemat_zasilania",
    label: "Schemat zasilania",
    patterns: ["schemat zasilani"],
  },
  { id: "garaz", label: "Garaż", patterns: ["garaż", "garaz"] },
  { id: "parter", label: "Parter", patterns: ["parter"] },
];

/** Czy opis matchuje daną kategorię (any-of patterns). */
function matchesTopic(desc: string, topic: TopicFilter): boolean {
  const lower = desc.toLowerCase();
  return topic.patterns.some((p) => lower.includes(p));
}

export function FileBrowser() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const path = searchParams.get("filePath") ?? "";

  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState<string>(FILTER_ALL);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["nas-list", path],
    queryFn: () => fetchList(path),
    staleTime: 30_000,
  });

  // Bulk lookup opisów rysunków dla aktualnego folderu
  const codes = useMemo(() => {
    if (!data?.entries) return [];
    return Array.from(
      new Set(
        data.entries
          .filter((e) => !e.isDir)
          .map((e) => extractDrawingCode(e.name))
          .filter((c): c is string => c !== null),
      ),
    );
  }, [data]);

  const drawingsQuery = useQuery(
    trpc.drawing.lookupByCodes.queryOptions(
      { projectCode: "Z4", codes },
      { enabled: codes.length > 0, staleTime: 5 * 60_000 },
    ),
  );

  const descriptionByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of drawingsQuery.data ?? []) {
      map.set(d.fileCode, d.description);
    }
    return map;
  }, [drawingsQuery.data]);

  // Wzbogacone wpisy + filtrowanie + search
  const filteredEntries = useMemo(() => {
    if (!data?.entries) return [];
    const q = search.trim().toLowerCase();

    return data.entries
      .map((entry) => {
        const code = entry.isDir ? null : extractDrawingCode(entry.name);
        const description = code
          ? descriptionByCode.get(code) ?? null
          : null;
        const disc = entry.isDir ? null : extractDiscipline(entry.name);
        return { entry, description, discipline: disc };
      })
      .filter(({ entry, description, discipline: disc }) => {
        // Filtr dyscypliny — foldery zawsze przepuszczamy
        if (
          discipline !== FILTER_ALL &&
          !entry.isDir &&
          disc !== discipline
        ) {
          return false;
        }
        // Filtr kategorii — wszystkie aktywne kategorie muszą matchować opis (AND).
        // Foldery zawsze przepuszczamy żeby nawigacja działała.
        if (activeTags.length > 0 && !entry.isDir) {
          if (!description) return false;
          const allMatch = activeTags.every((id) => {
            const topic = TOPIC_FILTERS.find((t) => t.id === id);
            return topic ? matchesTopic(description, topic) : false;
          });
          if (!allMatch) return false;
        }
        // Search — match nazwy lub opisu (foldery: tylko nazwa)
        if (q) {
          const inName = entry.name.toLowerCase().includes(q);
          const inDesc = description
            ? description.toLowerCase().includes(q)
            : false;
          if (!inName && !inDesc) return false;
        }
        return true;
      });
  }, [data, descriptionByCode, search, discipline, activeTags]);

  // Liczba plików matchująca każdą kategorię w aktualnym folderze.
  // Pomijamy kategorie z 0 wyników żeby nie zaśmiecać UI.
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of data?.entries ?? []) {
      if (e.isDir) continue;
      const code = extractDrawingCode(e.name);
      if (!code) continue;
      const desc = descriptionByCode.get(code);
      if (!desc) continue;
      for (const topic of TOPIC_FILTERS) {
        if (matchesTopic(desc, topic)) {
          counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [data, descriptionByCode]);

  const visibleTopics = useMemo(
    () => TOPIC_FILTERS.filter((t) => (topicCounts.get(t.id) ?? 0) > 0),
    [topicCounts],
  );

  const toggleTag = (id: string) => {
    setActiveTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  // Lista dostępnych dyscyplin w aktualnym folderze
  const availableDisciplines = useMemo(() => {
    if (!data?.entries) return [];
    const set = new Set<string>();
    for (const e of data.entries) {
      if (e.isDir) continue;
      const d = extractDiscipline(e.name);
      if (d) set.add(d);
    }
    return Array.from(set).sort();
  }, [data]);

  const navigate = (newPath: string) => {
    const params = new URLSearchParams(searchParams);
    if (newPath) params.set("filePath", newPath);
    else params.delete("filePath");
    router.push(`/mapa?${params.toString()}`);
    setSearch("");
    setDiscipline(FILTER_ALL);
    setActiveTags([]);
  };

  const openFile = (filePath: string) => {
    window.open(`/api/files?path=${encodeURIComponent(filePath)}`, "_blank");
  };

  const totalCount = data?.entries.length ?? 0;
  const filteredCount = filteredEntries.length;
  const hasFilters =
    search.trim() !== "" ||
    discipline !== FILTER_ALL ||
    activeTags.length > 0;

  return (
    <div className="space-y-3">
      <PathBreadcrumb currentPath={data?.path ?? ""} onNavigate={navigate} />

      {/* Search + filtr */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po nazwie lub opisie…"
            className="w-full rounded-sm border bg-background pl-8 pr-8 py-1.5 text-sm placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {availableDisciplines.length > 0 && (
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="rounded-sm border bg-background px-2 py-1.5 text-sm"
          >
            <option value={FILTER_ALL}>Wszystkie branże</option>
            {availableDisciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {hasFilters && (
          <>
            <span className="text-xs text-muted-foreground font-mono">
              {filteredCount}/{totalCount}
            </span>
            <button
              onClick={() => {
                setSearch("");
                setDiscipline(FILTER_ALL);
                setActiveTags([]);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              wyczyść
            </button>
          </>
        )}

        <button
          onClick={() => setShowCodes((v) => !v)}
          className={cn(
            "rounded-sm border px-2 py-1.5 text-xs font-mono transition-colors",
            showCodes
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted",
          )}
          title="Pokaż wyciągnięte kody plików (debug)"
        >
          {showCodes ? "✓ kody" : "kody"}
        </button>
      </div>

      {/* Kategorie tematyczne — stała lista, ukryte gdy brak matchu */}
      {visibleTopics.length > 0 && (
        <div className="rounded-lg border bg-card p-2.5 shadow-sm">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Filtruj po opisie {activeTags.length > 0 && `(${activeTags.length} aktywne)`}
          </div>
          <div className="flex flex-wrap gap-1">
            {visibleTopics.map((topic) => {
              const active = activeTags.includes(topic.id);
              const count = topicCounts.get(topic.id) ?? 0;
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTag(topic.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {topic.label}
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      active
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ładowanie zawartości…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Nie udało się pobrać listy: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {filteredEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
              {totalCount === 0
                ? "Folder jest pusty"
                : "Brak wyników dla wybranych filtrów"}
            </div>
          ) : (
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              {/* Header (desktop) */}
              <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_50px_70px_80px_24px] gap-3 border-b bg-muted/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div>Nazwa</div>
                <div>Opis</div>
                <div className="text-center">Rew.</div>
                <div className="text-right">Rozmiar</div>
                <div className="text-right">Modyfikacja</div>
                <div></div>
              </div>
              <ul className="divide-y">
                {filteredEntries.map(({ entry, description }) => {
                  const code = entry.isDir ? null : extractDrawingCode(entry.name);
                  return (
                    <FileRow
                      key={entry.path}
                      entry={entry}
                      description={description}
                      extractedCode={code}
                      showCode={showCodes}
                      highlight={search.trim()}
                      onFolderClick={() => navigate(entry.path)}
                      onFileClick={() => openFile(entry.path)}
                    />
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PathBreadcrumb({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  const segments = currentPath.split("/").filter(Boolean);
  const baseDepth = 2;
  const visibleSegments = segments.slice(baseDepth);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <button
        onClick={() => onNavigate("")}
        className="flex items-center gap-1.5 rounded px-2 py-1 font-medium text-foreground transition-colors hover:bg-background"
      >
        <Home className="h-3.5 w-3.5" />
        JDK-Z4
      </button>
      {visibleSegments.map((seg, idx) => {
        const fullPath = "/" + segments.slice(0, baseDepth + idx + 1).join("/");
        const isLast = idx === visibleSegments.length - 1;
        return (
          <div key={fullPath} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            {isLast ? (
              <span className="rounded px-2 py-1 font-medium text-muted-foreground">
                {seg}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(fullPath)}
                className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {seg}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function FileRow({
  entry,
  description,
  extractedCode,
  showCode,
  highlight,
  onFolderClick,
  onFileClick,
}: {
  entry: NasEntry;
  description: string | null;
  extractedCode: string | null;
  showCode: boolean;
  highlight: string;
  onFolderClick: () => void;
  onFileClick: () => void;
}) {
  const Icon = getIcon(entry);
  const handleClick = entry.isDir ? onFolderClick : onFileClick;
  const revision = entry.isDir ? null : extractRevision(entry.name);

  return (
    <li>
      <button
        onClick={handleClick}
        className={cn(
          "grid w-full grid-cols-[24px_minmax(0,1fr)_24px] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
          "md:grid-cols-[24px_minmax(0,1fr)_minmax(0,1.2fr)_50px_70px_80px_24px]",
          entry.isDir && "font-medium",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            entry.isDir ? "text-primary" : "text-muted-foreground",
          )}
          strokeWidth={2}
        />
        <div className="min-w-0">
          <div className="truncate text-sm" title={entry.name}>
            <Highlight text={entry.name} term={highlight} />
          </div>
          {/* Opis pod nazwą — tylko mobile (md:hidden) */}
          {description && (
            <div
              className="md:hidden truncate text-[11px] text-foreground/80 mt-0.5"
              title={description}
            >
              <Highlight text={description} term={highlight} />
            </div>
          )}
          {showCode && extractedCode && (
            <div className="truncate text-[10px] font-mono text-muted-foreground/70 mt-0.5">
              {extractedCode}
            </div>
          )}
        </div>
        {/* Opis jako osobna kolumna — desktop */}
        <div
          className="hidden md:block min-w-0 truncate text-xs text-foreground/85"
          title={description ?? extractedCode ?? ""}
        >
          {description ? (
            <Highlight text={description} term={highlight} />
          ) : extractedCode ? (
            <span
              className="font-mono text-[10px] text-amber-600 dark:text-amber-400"
              title={`Brak opisu w indeksie. Kod wyciągnięty z nazwy: ${extractedCode}`}
            >
              ⚠ {extractedCode}
            </span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </div>
        <span className="hidden md:inline shrink-0 font-mono text-[11px] text-muted-foreground text-center">
          {revision ?? ""}
        </span>
        <span className="hidden md:inline shrink-0 font-mono text-[11px] text-muted-foreground text-right">
          {entry.isDir ? "" : formatSize(entry.size)}
        </span>
        <span className="hidden md:inline shrink-0 font-mono text-[11px] text-muted-foreground text-right">
          {entry.mtime ? formatDate(entry.mtime) : ""}
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            entry.isDir ? "text-muted-foreground" : "text-muted-foreground/30",
          )}
        />
      </button>
    </li>
  );
}

/** Highlight matching substring (case-insensitive). */
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const idx = lower.indexOf(lowerTerm);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

function getIcon(entry: NasEntry) {
  if (entry.isDir) return Folder;
  const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return FileText;
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext))
    return FileImage;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}
