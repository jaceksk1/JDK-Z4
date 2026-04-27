/**
 * Przypisuje cardCode mieszkaniom i lokalom (commercial).
 *
 * Format:
 *   - apartment: {klatka}.{piętroDisplay}.{nrLokalnyNaPiętrze}  np. "A1.1.5"
 *     (piętroDisplay = floor.storey, klatka A1/A2/B1/B2 z designatora)
 *   - commercial: cardCode = designator (np. "A1.U.1") — bez przeliczania
 *
 * Ranking lokalny: dla mieszkań na danym piętrze klatki sortuje natural
 * po designatorze i numeruje 1..N.
 *
 * Folder na NAS: BUDYNEK X/PDF/{cardCode}/{cardCode}.{karta|osw|gn}.pdf
 *
 * Uruchomienie: pnpm db:seed-cards
 * Idempotentny — nadpisuje istniejące cardCode.
 */

import { eq } from "drizzle-orm";

import { db } from "./client";
import { floors, units } from "./schema";

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
  console.log("🪪 Przypisuję cardCode (apartment + commercial)…");

  const rows = await db
    .select({
      id: units.id,
      designator: units.designator,
      type: units.type,
      cardCode: units.cardCode,
      storey: floors.storey,
    })
    .from(units)
    .leftJoin(floors, eq(units.floorId, floors.id));

  let updated = 0;

  // ─── COMMERCIAL: cardCode = designator ──────────────────────────────────
  const commercials = rows.filter((u) => u.type === "commercial");
  for (const lu of commercials) {
    if (lu.cardCode === lu.designator) continue;
    await db
      .update(units)
      .set({ cardCode: lu.designator })
      .where(eq(units.id, lu.id));
    updated++;
  }
  console.log(
    `📦 Commercial (LU): ${commercials.length} sztuk → cardCode = designator`,
  );

  // ─── APARTMENT: klatka.piętroDisplay.nrLokalny ──────────────────────────
  const apartments = rows.filter((u) => u.type === "apartment");

  // Grupuj po (klatka, piętroDisplay)
  const groups = new Map<string, typeof apartments>();
  for (const a of apartments) {
    const m = a.designator.match(/^([AB][12])\.\d+\.\d+$/);
    if (!m) {
      console.warn(`⚠️  Pomijam ${a.designator} — niepasujący format`);
      continue;
    }
    const klatka = m[1]!;
    const storey = a.storey;
    if (storey === null || storey < 1) {
      console.warn(
        `⚠️  Pomijam ${a.designator} — brak/niepoprawny storey (${storey})`,
      );
      continue;
    }
    const key = `${klatka}.${storey}`;
    const arr = groups.get(key) ?? [];
    arr.push(a);
    groups.set(key, arr);
  }

  const sortedGroupKeys = [...groups.keys()].sort(naturalSort);
  for (const key of sortedGroupKeys) {
    const list = groups.get(key)!;
    list.sort((x, y) => naturalSort(x.designator, y.designator));
    console.log(`   ${key}: ${list.length} mieszkań`);
    for (let i = 0; i < list.length; i++) {
      const apt = list[i]!;
      const cardCode = `${key}.${i + 1}`;
      if (apt.cardCode === cardCode) continue;
      await db.update(units).set({ cardCode }).where(eq(units.id, apt.id));
      updated++;
    }
  }

  console.log(`\n✅ Zaktualizowano ${updated} jednostek (cardCode).`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
