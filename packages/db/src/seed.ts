/**
 * Seed script — JDK Z4 / Zaspa IV Gdańsk
 *
 * Uruchomienie: pnpm db:seed (z korzenia repo)
 *
 * Co robi:
 *  1. Tworzy projekt Z4
 *  2. Tworzy budynki A i B
 *  3. Tworzy sekcje A1, A2, B1, B2
 *  4. Parsuje dane/discover_output.txt → mieszkania + LU
 *  5. Generuje MP20–MP317 i KL 1–184 programatycznie
 *
 * Idempotentny — jeśli projekt Z4 istnieje, przerywa bez błędu.
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { db } from "./client";
import { buildings, projects, sections, units } from "./schema";

// ─── Ścieżka do pliku z danymi ────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// packages/db/src/seed.ts → ../../.. → korzeń repo
const DISCOVER_PATH = resolve(__dirname, "../../../dane/discover_output.txt");

// ─── Typy pomocnicze ──────────────────────────────────────────────────────────

interface ApartmentRecord {
  designator: string;
  sectionName: string;
  floor: string;
}

interface LuRecord {
  designator: string;
  sectionName: string;
}

// ─── Parser discover_output.txt ───────────────────────────────────────────────

function parseDiscoverOutput(filePath: string): {
  apartments: ApartmentRecord[];
  lu: LuRecord[];
} {
  const content = readFileSync(filePath, "utf-8");

  // Mieszkania — dwa formaty w DWG:
  //   Format A: "A1.2.5-QF1"  → section=A1, floor=2, unit=5
  //   Format B: "B1.7.224.5"  → section=B1, floor=7, unit=224, circuit=5
  const apartmentSet = new Set<string>();

  // Format A: [AB][12].[floor].[unit]-QF[n]
  for (const match of content.matchAll(/([AB][12]\.\d+\.\d+)-QF\d+/g)) {
    apartmentSet.add(match[1]!);
  }
  // Format B: [AB][12].[floor].[unit].[circuit] — tylko jeśli wszystkie części numeryczne
  for (const match of content.matchAll(/([AB][12]\.\d+\.\d+)\.\d+(?!\d)/g)) {
    apartmentSet.add(match[1]!);
  }

  const apartments: ApartmentRecord[] = [];
  for (const designator of apartmentSet) {
    const parts = designator.split(".");
    if (parts.length !== 3) continue;
    const [sectionName, floorStr] = parts;
    if (!sectionName || !floorStr) continue;
    const floorNum = parseInt(floorStr, 10);
    if (isNaN(floorNum) || floorNum < 0 || floorNum > 7) continue;
    apartments.push({
      designator,
      sectionName,
      floor: `P${String(floorNum).padStart(2, "0")}`,
    });
  }

  // LU — format: "A1.U.1.2" → strip ostatnią część → "A1.U.1"
  const luSet = new Set<string>();
  for (const match of content.matchAll(/([AB][12]\.U\.\d+)\.\d+(?!\d)/g)) {
    luSet.add(match[1]!);
  }

  const lu: LuRecord[] = [];
  for (const designator of luSet) {
    const sectionName = designator.split(".")[0];
    if (!sectionName) continue;
    lu.push({ designator, sectionName });
  }

  return { apartments, lu };
}

// ─── Generatory MP i KL ───────────────────────────────────────────────────────

/** MP20–MP317 = 298 miejsc parkingowych (wg kart katalogowych) */
function generateMP(): string[] {
  const result: string[] = [];
  for (let i = 20; i <= 317; i++) {
    result.push(`MP${i}`);
  }
  return result;
}

/** KL 1–184 = 184 komórek lokatorskich */
function generateKL(): string[] {
  const result: string[] = [];
  for (let i = 1; i <= 184; i++) {
    result.push(`KL ${i}`);
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 JDK Z4 — seed start");

  // ── Idempotencja: sprawdź czy projekt już istnieje ──────────────────────────
  const existing = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.code, "Z4"),
  });
  if (existing) {
    console.log("⚠️  Projekt Z4 już istnieje w bazie. Seed pominięty.");
    console.log("   Aby przeładować dane — usuń projekt Z4 z Supabase i uruchom ponownie.");
    process.exit(0);
  }

  // ── 1. Projekt ──────────────────────────────────────────────────────────────
  const [project] = await db
    .insert(projects)
    .values({ name: "Zaspa IV Gdańsk", code: "Z4" })
    .returning();
  if (!project) throw new Error("Nie udało się utworzyć projektu");
  console.log(`✅ Projekt: ${project.name} (${project.id})`);

  // ── 2. Budynki ──────────────────────────────────────────────────────────────
  const buildingRows = await db
    .insert(buildings)
    .values([
      { projectId: project.id, name: "A" },
      { projectId: project.id, name: "B" },
    ])
    .returning();

  const buildingMap = new Map(buildingRows.map((b) => [b.name, b]));
  console.log(`✅ Budynki: ${buildingRows.map((b) => b.name).join(", ")}`);

  // ── 3. Sekcje ───────────────────────────────────────────────────────────────
  const buildingA = buildingMap.get("A");
  const buildingB = buildingMap.get("B");
  if (!buildingA || !buildingB) throw new Error("Brak budynków w mapie");

  const sectionRows = await db
    .insert(sections)
    .values([
      { buildingId: buildingA.id, name: "A1" },
      { buildingId: buildingA.id, name: "A2" },
      { buildingId: buildingB.id, name: "B1" },
      { buildingId: buildingB.id, name: "B2" },
    ])
    .returning();

  const sectionMap = new Map(sectionRows.map((s) => [s.name, s]));
  console.log(`✅ Sekcje: ${sectionRows.map((s) => s.name).join(", ")}`);

  // ── 4. Parsuj dane ──────────────────────────────────────────────────────────
  console.log(`📂 Parsowanie: ${DISCOVER_PATH}`);
  const { apartments, lu } = parseDiscoverOutput(DISCOVER_PATH);
  const mpList = generateMP();
  const klList = generateKL();

  console.log(`   Mieszkania z DWG:  ${apartments.length}`);
  console.log(`   LU z DWG:          ${lu.length}`);
  console.log(`   MP generowane:     ${mpList.length} (MP20–MP317)`);
  console.log(`   KL generowane:     ${klList.length} (KL 1–184)`);
  console.log(
    `   Łącznie:           ${apartments.length + lu.length + mpList.length + klList.length}`,
  );

  // ── 5. Wstaw jednostki (batch po 100) ────────────────────────────────────────
  type UnitInsert = typeof units.$inferInsert;
  const allUnits: UnitInsert[] = [];

  // Mieszkania
  for (const apt of apartments) {
    const section = sectionMap.get(apt.sectionName);
    if (!section) {
      console.warn(`  ⚠️  Nieznana sekcja: ${apt.sectionName} (${apt.designator})`);
      continue;
    }
    const building = buildingRows.find((b) => b.id === section.buildingId);
    allUnits.push({
      projectId: project.id,
      buildingId: building?.id ?? null,
      sectionId: section.id,
      type: "apartment",
      designator: apt.designator,
      floor: apt.floor,
      status: "not_started",
    });
  }

  // LU
  for (const luUnit of lu) {
    const section = sectionMap.get(luUnit.sectionName);
    if (!section) {
      console.warn(`  ⚠️  Nieznana sekcja LU: ${luUnit.sectionName} (${luUnit.designator})`);
      continue;
    }
    const building = buildingRows.find((b) => b.id === section.buildingId);
    allUnits.push({
      projectId: project.id,
      buildingId: building?.id ?? null,
      sectionId: section.id,
      type: "commercial",
      designator: luUnit.designator,
      floor: "P00",
      status: "not_started",
    });
  }

  // MP — bez budynku i sekcji (garaż wspólny)
  for (const mp of mpList) {
    allUnits.push({
      projectId: project.id,
      buildingId: null,
      sectionId: null,
      type: "parking",
      designator: mp,
      floor: "G01",
      status: "not_started",
    });
  }

  // KL — bez budynku i sekcji
  for (const kl of klList) {
    allUnits.push({
      projectId: project.id,
      buildingId: null,
      sectionId: null,
      type: "storage",
      designator: kl,
      floor: null,
      status: "not_started",
    });
  }

  // Batch insert po 100 rekordów
  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < allUnits.length; i += BATCH_SIZE) {
    const batch = allUnits.slice(i, i + BATCH_SIZE);
    await db.insert(units).values(batch);
    inserted += batch.length;
    process.stdout.write(`\r   Wstawianie: ${inserted}/${allUnits.length}`);
  }
  console.log(`\n✅ Wstawiono ${inserted} jednostek`);

  console.log("🎉 Seed zakończony pomyślnie!");
  console.log("ℹ️  Aby utworzyć konto admin: pnpm db:seed-admin");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed nieudany:", err);
  process.exit(1);
});
