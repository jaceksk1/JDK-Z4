"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

const PROJECT_CODE = "Z4";

const PROMPT_TEMPLATE = `Przeanalizuj załączony dokument z opisem rysunków branżowych projektu Zaspa IV Gdańsk.
Dokument może zawierać rysunki RÓŻNYCH dyscyplin (ELE elektryka, TEL teletechnika, SAN sanitarna,
KON konstrukcja, ARCH architektura) — wyciągnij WSZYSTKIE z dokumentu, niezależnie od branży.

Zwróć JEDYNIE czysty JSON (bez komentarzy, bez markdown'a) jako tablicę obiektów:

[
  {
    "fileCode": "6295_01_PW_ELE_XXX_XXX_X_RYS_001",   // kod rysunku BEZ ostatnich segmentów wersji (np. _01_02)
    "description": "Schemat tablicy TR1.4 — klatka A1, parter",
    "discipline": "ELE",      // ELE / TEL / SAN / KON / ARCH lub null — czytaj z 4. segmentu kodu
    "phase": "PW",            // PW / KZM / NA lub null — z 3. segmentu kodu
    "revision": "01_02"       // ostatnie segmenty z nazwy pliku (informacyjnie) lub null
  }
]

Zasady:
- fileCode = STAŁA część kodu z dokumentu OPI, ZAWSZE 9 segmentów (np.
  "6295_01_PW_ELE_ROZ_XXX_X_SCH_XXX" lub "6295_01_PW_ELE_OUZ_A00_X_RZU_P01"),
  9. segment może być placeholderem "XXX" lub konkretnym oznaczeniem (G01, P01, ...).
  NIE dopisuj numeru rysunku do fileCode — numer pojawi się osobno w revision.
- revision = format "NN_MM" gdzie NN = numer rysunku (1-99), MM = minor rewizji
  (np. "07_01" — rysunek nr 7, rewizja 01). Czytaj z tabeli OPI, kolumna
  "Rewizja" lub "Nr rysunku/wersja".
- Każda para (fileCode, revision[NN]) musi być unikalna w obrębie projektu.
  Jeśli widzisz rzędy z tym samym fileCode i różnymi opisami, sprawdź czy
  rzeczywiście mają różne NN w revision.
- description = treść z dokumentu, max 500 znaków, polski
- Pomiń rysunki bez kodu lub bez opisu
- Zwróć tylko JSON, nic więcej`;

interface DrawingItem {
  fileCode: string;
  description: string;
  discipline?: string | null;
  phase?: string | null;
  revision?: string | null;
}

/**
 * Pliki PDF na NAS mają 11 segmentów: 9 segmentów prefiksu (jak w fileCode z OPI)
 * + numer rysunku + minor rewizji. fileCode w JSON ma tylko 9 segmentów — brakuje
 * mu 10. segmentu (numeru rysunku), który projektant zapisał w polu `revision`
 * w formacie "NN_MM" (NN = numer rysunku, MM = minor).
 *
 * Dopisujemy numer z revision jako 10. segment, żeby kod był unikalny i matchował
 * to co zwraca extractDrawingCode w file-browser.
 *
 * Przykład: ("6295_01_PW_ELE_ROZ_XXX_X_SCH_XXX", "07_01")
 *           → "6295_01_PW_ELE_ROZ_XXX_X_SCH_XXX_07"
 *
 * Działa identycznie dla rzutów z konkretnym 9. segmentem:
 *   ("6295_01_PW_ELE_OUZ_A00_X_RZU_P01", "01_00")
 *   → "6295_01_PW_ELE_OUZ_A00_X_RZU_P01_01"
 */
function expandFileCode(
  fileCode: string,
  revision: string | null | undefined,
): { code: string; expanded: boolean } {
  if (!revision) return { code: fileCode, expanded: false };
  const parts = fileCode.split("_");
  if (parts.length !== 9) return { code: fileCode, expanded: false };
  const m = /^(\d+)_\d+$/.exec(revision.trim());
  if (!m?.[1]) return { code: fileCode, expanded: false };
  const num = m[1].padStart(2, "0");
  return { code: fileCode + "_" + num, expanded: true };
}

interface PreviewItem extends DrawingItem {
  selected: boolean;
  duplicateCodeGroup: number | null;
  duplicateDescGroup: number | null;
  originalFileCode: string | null;
}

interface ParseStats {
  total: number;
  uniqueCodes: number;
  duplicateCodeGroups: number;
  duplicateCodeRows: number;
  duplicateDescGroups: number;
  duplicateDescRows: number;
  expandedCodes: number;
}

export default function AdminDrawingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [json, setJson] = useState("");
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStats, setParseStats] = useState<ParseStats | null>(null);

  const listQuery = useQuery(
    trpc.drawing.list.queryOptions({ projectCode: PROJECT_CODE }),
  );

  const importMutation = useMutation(
    trpc.drawing.import.mutationOptions({
      onSuccess: (result) => {
        setJson("");
        setPreview(null);
        setParseError(null);
        setParseStats(null);
        void queryClient.invalidateQueries({
          queryKey: trpc.drawing.list.queryKey({ projectCode: PROJECT_CODE }),
        });
        const dupNote =
          result.duplicatesRemoved > 0
            ? ` (usunięto ${result.duplicatesRemoved} duplikatów po fileCode)`
            : "";
        alert(`Zaimportowano ${result.imported} pozycji${dupNote}.`);
      },
      onError: (err) => alert(`Błąd importu: ${err.message}`),
    }),
  );

  const clearMutation = useMutation(
    trpc.drawing.clear.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.drawing.list.queryKey({ projectCode: PROJECT_CODE }),
        });
      },
    }),
  );

  const handleParse = () => {
    setParseError(null);
    setPreview(null);
    setParseStats(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(json.trim());
    } catch (e) {
      setParseError("Niepoprawny JSON: " + (e as Error).message);
      return;
    }

    if (!Array.isArray(parsed)) {
      setParseError("Oczekiwana tablica obiektów");
      return;
    }

    const rawItems: Omit<PreviewItem, "duplicateCodeGroup" | "duplicateDescGroup">[] = [];
    const errors: string[] = [];
    let expandedCodes = 0;

    parsed.forEach((row, idx) => {
      if (typeof row !== "object" || row === null) {
        errors.push(`#${idx + 1}: nie jest obiektem`);
        return;
      }
      const obj = row as Record<string, unknown>;
      const rawFileCode = typeof obj.fileCode === "string" ? obj.fileCode.trim() : "";
      const description =
        typeof obj.description === "string" ? obj.description.trim() : "";
      if (!rawFileCode || !description) {
        errors.push(`#${idx + 1}: brak fileCode lub description`);
        return;
      }
      const revision = typeof obj.revision === "string" ? obj.revision : null;
      const { code: fileCode, expanded } = expandFileCode(rawFileCode, revision);
      if (expanded) expandedCodes++;
      rawItems.push({
        fileCode,
        originalFileCode: expanded ? rawFileCode : null,
        description,
        discipline:
          typeof obj.discipline === "string" ? obj.discipline : null,
        phase: typeof obj.phase === "string" ? obj.phase : null,
        revision,
        selected: true,
      });
    });

    if (errors.length > 0) {
      setParseError(
        `Pominięto ${errors.length} pozycji:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n…" : ""}`,
      );
    }
    if (rawItems.length === 0) {
      setParseError(
        (parseError ? parseError + "\n" : "") + "Brak poprawnych pozycji",
      );
      return;
    }

    // Wykrywanie duplikatów fileCode (problem — backend dedupe zostawi tylko ostatni)
    const codeIndices = new Map<string, number[]>();
    rawItems.forEach((it, idx) => {
      const arr = codeIndices.get(it.fileCode) ?? [];
      arr.push(idx);
      codeIndices.set(it.fileCode, arr);
    });
    const codeGroupId = new Map<string, number>();
    let codeGroupCounter = 0;
    let duplicateCodeRows = 0;
    for (const [code, idxs] of codeIndices) {
      if (idxs.length > 1) {
        codeGroupId.set(code, ++codeGroupCounter);
        duplicateCodeRows += idxs.length;
      }
    }

    // Wykrywanie duplikatów description (informacyjnie — może być poprawne)
    const descIndices = new Map<string, number[]>();
    rawItems.forEach((it, idx) => {
      const key = it.description.toLowerCase();
      const arr = descIndices.get(key) ?? [];
      arr.push(idx);
      descIndices.set(key, arr);
    });
    const descGroupId = new Map<string, number>();
    let descGroupCounter = 0;
    let duplicateDescRows = 0;
    for (const [key, idxs] of descIndices) {
      if (idxs.length > 1) {
        descGroupId.set(key, ++descGroupCounter);
        duplicateDescRows += idxs.length;
      }
    }

    const items: PreviewItem[] = rawItems.map((it) => ({
      ...it,
      duplicateCodeGroup: codeGroupId.get(it.fileCode) ?? null,
      duplicateDescGroup: descGroupId.get(it.description.toLowerCase()) ?? null,
    }));

    setParseStats({
      total: rawItems.length,
      uniqueCodes: codeIndices.size,
      duplicateCodeGroups: codeGroupCounter,
      duplicateCodeRows,
      duplicateDescGroups: descGroupCounter,
      duplicateDescRows,
      expandedCodes,
    });
    setPreview(items);
  };

  const handleImport = () => {
    if (!preview) return;
    const selected = preview.filter((p) => p.selected);
    if (selected.length === 0) {
      alert("Zaznacz przynajmniej jedną pozycję");
      return;
    }
    importMutation.mutate({
      projectCode: PROJECT_CODE,
      items: selected.map(
        ({
          selected: _s,
          duplicateCodeGroup: _c,
          duplicateDescGroup: _d,
          originalFileCode: _o,
          ...rest
        }) => rest,
      ),
    });
  };

  const toggleAll = (next: boolean) => {
    if (!preview) return;
    setPreview(preview.map((p) => ({ ...p, selected: next })));
  };

  const toggleOne = (idx: number) => {
    if (!preview) return;
    setPreview(
      preview.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p)),
    );
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(PROMPT_TEMPLATE);
    alert("Skopiowano prompt do schowka");
  };

  const selectedCount = useMemo(
    () => preview?.filter((p) => p.selected).length ?? 0,
    [preview],
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Indeks rysunków</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Mapowanie kodów plików projektowych (np. <code className="font-mono">6295_01_PW_ELE_XXX_XXX_X_RYS_001</code>)
          na opisy z dokumentu OPI. Pozwala wyszukiwać rysunki w przeglądarce plików po opisie.
        </p>
      </div>

      {/* Instrukcja */}
      <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Jak to zrobić</h2>
        <ol className="ml-5 list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            Otwórz <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">claude.ai</a> i załaduj plik z opisem rysunków
            (DOCX lub PDF — konwertuj DOC w Wordzie przez „Save As").
          </li>
          <li>
            Wklej do czatu poniższy prompt:
            <button
              onClick={copyPrompt}
              className="ml-2 inline-flex items-center gap-1 rounded-sm border bg-background px-2 py-1 text-xs hover:bg-muted"
            >
              <ClipboardCopy className="h-3 w-3" />
              Kopiuj prompt
            </button>
          </li>
          <li>Skopiuj wynik (czysty JSON) i wklej do pola poniżej.</li>
          <li>Zweryfikuj listę, odznacz błędne pozycje i kliknij „Importuj zatwierdzone".</li>
        </ol>
      </div>

      {/* Textarea + parse */}
      <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium">JSON z Claude.ai</label>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='[{"fileCode":"6295_01_PW_ELE_XXX_XXX_X_RYS_001","description":"…",...}]'
          className="h-40 w-full rounded-sm border bg-background p-3 font-mono text-xs"
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleParse}
            disabled={!json.trim()}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Wczytaj i podejrzyj
          </button>
          {parseError && (
            <div className="flex items-start gap-1.5 text-xs text-destructive whitespace-pre-line">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {parseError}
            </div>
          )}
        </div>
      </div>

      {/* Diagnostyka */}
      {parseStats && (parseStats.duplicateCodeGroups > 0 || parseStats.duplicateDescGroups > 0 || parseStats.expandedCodes > 0) && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
            <div className="space-y-2">
              <div className="font-medium">Diagnostyka importu</div>
              {parseStats.expandedCodes > 0 && (
                <div className="text-emerald-700 dark:text-emerald-400">
                  Rozszerzono <span className="font-medium">{parseStats.expandedCodes}</span> kodów —
                  doczepiono numer rysunku z <code className="font-mono">revision</code> jako 10. segment
                  (np. <code className="font-mono">..._SCH_XXX</code> + <code className="font-mono">07_01</code> →{" "}
                  <code className="font-mono">..._SCH_XXX_07</code>). Format zgodny z 11-segmentową nazwą
                  pliku PDF na NAS. Najedź na kod w tabeli, żeby zobaczyć oryginał.
                </div>
              )}
              {parseStats.duplicateCodeGroups > 0 && (
                <div>
                  <span className="font-medium text-destructive">
                    {parseStats.duplicateCodeRows} wierszy w {parseStats.duplicateCodeGroups} grupach
                  </span>{" "}
                  nadal ma identyczny <code className="font-mono">fileCode</code> po normalizacji — backend
                  zostawi tylko ostatni opis (czerwone wiersze).
                </div>
              )}
              {parseStats.duplicateDescGroups > 0 && (
                <div className="text-muted-foreground">
                  {parseStats.duplicateDescRows} wierszy w {parseStats.duplicateDescGroups} grupach ma identyczny opis przy różnych kodach (żółte wiersze).
                  To może być poprawne (np. tablica TR1.4 rozbita na kilka rysunków) — zweryfikuj w dokumencie.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mb-6 rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-sm">
                Podgląd ({selectedCount}/{preview.length})
              </h3>
              <button
                onClick={() => toggleAll(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Zaznacz wszystkie
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Odznacz
              </button>
            </div>
            <button
              onClick={handleImport}
              disabled={importMutation.isPending || selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {importMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Importuj zatwierdzone
            </button>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2 text-left font-medium">Kod</th>
                  <th className="px-3 py-2 text-left font-medium">Opis</th>
                  <th className="px-3 py-2 text-left font-medium w-16">Branża</th>
                  <th className="px-3 py-2 text-left font-medium w-16">Faza</th>
                  <th className="px-3 py-2 text-left font-medium w-16">Rev</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b hover:bg-muted/30",
                      !row.selected && "opacity-40",
                      row.duplicateCodeGroup !== null &&
                        "bg-destructive/5 hover:bg-destructive/10",
                      row.duplicateCodeGroup === null &&
                        row.duplicateDescGroup !== null &&
                        "bg-yellow-500/5 hover:bg-yellow-500/10",
                    )}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => toggleOne(idx)}
                      />
                    </td>
                    <td
                      className="px-3 py-2 font-mono"
                      title={
                        row.originalFileCode
                          ? `Oryginał z JSON: ${row.originalFileCode}`
                          : undefined
                      }
                    >
                      {row.fileCode}
                      {row.originalFileCode && (
                        <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                          ✱
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.description}</td>
                    <td className="px-3 py-2 font-mono">{row.discipline ?? "—"}</td>
                    <td className="px-3 py-2 font-mono">{row.phase ?? "—"}</td>
                    <td className="px-3 py-2 font-mono">{row.revision ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista istniejących rysunków */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <h3 className="font-semibold text-sm">
            Aktualny indeks ({listQuery.data?.length ?? 0})
          </h3>
          {(listQuery.data?.length ?? 0) > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    "Usunąć WSZYSTKIE rysunki z indeksu? Operacja nieodwracalna.",
                  )
                ) {
                  clearMutation.mutate({ projectCode: PROJECT_CODE });
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
              Wyczyść indeks
            </button>
          )}
        </div>
        {listQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Ładowanie…
          </div>
        ) : !listQuery.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Brak zaimportowanych rysunków. Zacznij od kroków powyżej.
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Kod</th>
                  <th className="px-3 py-2 text-left font-medium">Opis</th>
                  <th className="px-3 py-2 text-left font-medium w-16">Branża</th>
                  <th className="px-3 py-2 text-left font-medium w-16">Rev</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono">{d.fileCode}</td>
                    <td className="px-3 py-2">{d.description}</td>
                    <td className="px-3 py-2 font-mono">
                      {d.discipline ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono">{d.revision ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
