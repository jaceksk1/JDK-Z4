import { z } from "zod/v4";

/** Klucze modułów kontrolowanych przez grupy uprawnień. Single source of truth. */
export const MODULE_KEYS = ["mapa", "pliki", "zadania", "qa", "obecnosc"] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const moduleKeySchema = z.enum(MODULE_KEYS);

export interface ModuleDefinition {
  key: ModuleKey;
  /** Wyświetlana nazwa */
  label: string;
  /** Krótki opis dla checkboxów w panelu grup */
  hint: string;
}

export const MODULES: readonly ModuleDefinition[] = [
  { key: "mapa", label: "Mapa", hint: "Mapa budynku — drill-down do jednostek" },
  { key: "pliki", label: "Pliki", hint: "Przeglądarka plików projektowych z NAS" },
  { key: "zadania", label: "Zadania", hint: "Zgłoszenia i ich obsługa" },
  { key: "qa", label: "Q&A", hint: "Pytania i odpowiedzi techniczne" },
  { key: "obecnosc", label: "Obecność", hint: "Lista obecności i raporty miesięczne" },
] as const;
