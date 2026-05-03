/**
 * Jednorazowy skrypt — ustaw mustChangePassword=true wszystkim userom
 * oprócz admina. Używany po dodaniu pola mustChangePassword żeby pracownicy
 * z istniejących seedów byli zmuszeni zmienić hasło.
 */
import { ne } from "drizzle-orm";

import { db } from "./client";
import { user } from "./schema";

async function main() {
  const result = await db
    .update(user)
    .set({ mustChangePassword: true })
    .where(ne(user.username, "admin"))
    .returning({ username: user.username });
  console.log(`✅ Oznaczono ${result.length} userów do zmiany hasła:`);
  for (const u of result) console.log(`   - ${u.username}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
