/**
 * Przypisuje cardNumber mieszkaniom wg reguły: natural sort designatora per budynek
 * → numeracja ciągła 1..N przez klatki.
 *
 * Dla Z4: A1 ma 68 mieszkań (A_1..A_68), A2 ma 58 mieszkań (A_69..A_126).
 *         B1 ma 72 mieszkania (B_1..B_72), B2 ma 28 mieszkań (B_73..B_100).
 *
 * Plik PDF: ZAS4_MM_AR_INST_{A|B}_{cardNumber}.pdf
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
  console.log("🪪 Przypisuję numery kart mieszkaniom (natural sort per budynek)…");

  const apartments = await db.query.units.findMany({
    where: (u, { eq: eqFn }) => eqFn(u.type, "apartment"),
    columns: { id: true, designator: true, cardNumber: true },
  });

  if (apartments.length === 0) {
    console.log("⚠️  Brak mieszkań w bazie — nic do zrobienia.");
    process.exit(0);
  }

  const byBuilding = new Map<"A" | "B", typeof apartments>();
  for (const a of apartments) {
    const letter = a.designator.match(/^([AB])/)?.[1] as "A" | "B" | undefined;
    if (!letter) continue;
    const arr = byBuilding.get(letter) ?? [];
    arr.push(a);
    byBuilding.set(letter, arr);
  }

  let updated = 0;
  for (const [letter, list] of byBuilding) {
    list.sort((x, y) => naturalSort(x.designator, y.designator));
    console.log(`📦 Budynek ${letter}: ${list.length} mieszkań (${list[0]?.designator} … ${list[list.length - 1]?.designator})`);
    for (let i = 0; i < list.length; i++) {
      const apt = list[i]!;
      const cardNumber = i + 1;
      if (apt.cardNumber === cardNumber) continue;
      await db
        .update(units)
        .set({ cardNumber })
        .where(eq(units.id, apt.id));
      updated++;
    }
  }

  console.log(`✅ Zaktualizowano ${updated} mieszkań.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
