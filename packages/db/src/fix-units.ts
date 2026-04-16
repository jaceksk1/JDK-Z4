/**
 * Usuwa błędne jednostki z bazy — artefakty parsera DWG.
 *
 * Uruchomienie: pnpm db:fix-units
 *
 * Co usuwa:
 *  - A1.2.24, A1.2.30 (mieszkania) — projektant pomylił piętro w DWG (powinno być 3, nie 2)
 *    Prawdziwe oznaczenia w DWG z prefiksem TM: A1.3.24, A1.3.30
 *  - B2.U.28, B2.U.29 (LU) — są w DWG ale nie mają kart katalogowych (wg analizy projektu)
 */

import { inArray } from "drizzle-orm";

import { db } from "./client";
import { units } from "./schema";

const BAD_DESIGNATORS = ["A1.2.24", "A1.2.30", "B2.U.28", "B2.U.29"];

async function fix() {
  console.log("🔧 Sprawdzam błędne jednostki…");

  const existing = await db.query.units.findMany({
    where: (u, { inArray: inArrayFn }) =>
      inArrayFn(u.designator, BAD_DESIGNATORS),
  });

  if (existing.length === 0) {
    console.log("✅ Brak błędnych jednostek w bazie — nic do zrobienia.");
    process.exit(0);
  }

  console.log(`   Znaleziono ${existing.length} do usunięcia:`);
  for (const u of existing) {
    console.log(`   - ${u.designator} (${u.type}, id: ${u.id})`);
  }

  const result = await db
    .delete(units)
    .where(inArray(units.designator, BAD_DESIGNATORS))
    .returning({ designator: units.designator });

  console.log(`\n✅ Usunięto ${result.length} jednostek.`);
  console.log("   Teraz w bazie powinno być 735 jednostek (226+27+298+184).");
  process.exit(0);
}

fix().catch((err) => {
  console.error("❌ Błąd:", err);
  process.exit(1);
});
