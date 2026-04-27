/**
 * Przypisuje cardNumber mieszkaniom wg reguły: globalny natural sort designatora
 * → numeracja ciągła 1..N przez OBA budynki (nie per budynek!).
 *
 * Dla Z4: A: 1..126 (A1: 1..68, A2: 69..126), B: 127..226 (B1: 127..198, B2: 199..226).
 *
 * Plik PDF: ZAS4_MM_AR_INST_{A|B}_{cardNumber}.pdf — litera z designatora,
 * numer globalny (B startuje od 127).
 * Ścieżka NAS: /JDK/JDK-Z4/Projekt/08 Karty Katalogowe/2. KARTY INSTALACYJNE/BUDYNEK {A|B}/PDF/
 *
 * Uruchomienie: pnpm db:seed-cards
 * Idempotentny — nadpisuje istniejące wartości.
 */

import { eq } from "drizzle-orm";

import { db } from "./client";
import { units } from "./schema";

function naturalSort(a: string, b: string): number {
  const pa = a.split(/(\d+)/);
  const pb = b.split(/(\d+)/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const sa = pa[i] ?? "";
    const sb = pb[i] ?? "";
    const na = Number(sa);
    const nb = Number(sb);
    if (!isNaN(na) && !isNaN(nb)) {
      if (na !== nb) return na - nb;
    } else {
      const cmp = sa.localeCompare(sb);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

async function seed() {
  console.log("🪪 Przypisuję numery kart mieszkaniom (globalny natural sort A→B)…");

  const apartments = await db.query.units.findMany({
    where: (u, { eq: eqFn }) => eqFn(u.type, "apartment"),
    columns: { id: true, designator: true, cardNumber: true },
  });

  if (apartments.length === 0) {
    console.log("⚠️  Brak mieszkań w bazie — nic do zrobienia.");
    process.exit(0);
  }

  // Sortowanie globalne: A* przed B*, ciągła numeracja 1..N
  const sorted = [...apartments].sort((x, y) =>
    naturalSort(x.designator, y.designator),
  );

  let updated = 0;
  let firstA: string | undefined;
  let lastA: string | undefined;
  let firstB: string | undefined;
  let lastB: string | undefined;
  let firstBNum = 0;

  for (let i = 0; i < sorted.length; i++) {
    const apt = sorted[i]!;
    const cardNumber = i + 1;
    const letter = apt.designator[0];
    if (letter === "A") {
      firstA ??= apt.designator;
      lastA = apt.designator;
    } else if (letter === "B") {
      if (!firstB) {
        firstB = apt.designator;
        firstBNum = cardNumber;
      }
      lastB = apt.designator;
    }
    if (apt.cardNumber !== cardNumber) {
      await db
        .update(units)
        .set({ cardNumber })
        .where(eq(units.id, apt.id));
      updated++;
    }
  }

  console.log(`📦 Budynek A: ${firstA} … ${lastA}  (1..${firstBNum - 1})`);
  console.log(`📦 Budynek B: ${firstB} … ${lastB}  (${firstBNum}..${sorted.length})`);
  console.log(`✅ Zaktualizowano ${updated} mieszkań.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
