/**
 * Seed grup uprawnień + przypisanie istniejących użytkowników do grupy "Wszystkie moduły".
 * Uruchomienie: pnpm db:seed-groups
 *
 * Idempotentny — można odpalać wielokrotnie bezpiecznie.
 */
import { eq, inArray, isNull, notInArray, sql } from "drizzle-orm";

import { db } from "./client";
import { groupModules, groups, user, userGroups } from "./schema";

const MODULE_KEYS = ["mapa", "pliki", "zadania", "qa", "obecnosc"] as const;

interface SeedGroup {
  name: string;
  description: string;
  moduleKeys: readonly string[];
}

const SEED_GROUPS: SeedGroup[] = [
  {
    name: "Wszystkie moduły",
    description: "Pełen dostęp do wszystkich modułów aplikacji",
    moduleKeys: MODULE_KEYS,
  },
  {
    name: "Tylko Q&A",
    description: "Pracownicy którzy mają tylko zadawać pytania techniczne",
    moduleKeys: ["qa"],
  },
];

async function ensureGroup(seed: SeedGroup): Promise<string> {
  const existing = await db.query.groups.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.name, seed.name),
  });

  let groupId: string;
  if (existing) {
    console.log(`  • Grupa "${seed.name}" już istnieje — aktualizuję moduły`);
    groupId = existing.id;
    await db.delete(groupModules).where(eq(groupModules.groupId, groupId));
  } else {
    const [created] = await db
      .insert(groups)
      .values({ name: seed.name, description: seed.description })
      .returning();
    if (!created) throw new Error(`Nie udało się utworzyć grupy ${seed.name}`);
    groupId = created.id;
    console.log(`  ✅ Utworzono grupę "${seed.name}"`);
  }

  if (seed.moduleKeys.length > 0) {
    await db
      .insert(groupModules)
      .values(seed.moduleKeys.map((k) => ({ groupId, moduleKey: k })));
  }
  return groupId;
}

async function seedGroups() {
  console.log("🌱 Seed grup uprawnień...");

  const groupIds: Record<string, string> = {};
  for (const seed of SEED_GROUPS) {
    groupIds[seed.name] = await ensureGroup(seed);
  }

  // Przypisz wszystkich userów bez żadnej grupy do "Wszystkie moduły"
  const fallbackGroupId = groupIds["Wszystkie moduły"]!;

  const orphanRows = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .leftJoin(userGroups, eq(userGroups.userId, user.id))
    .where(isNull(userGroups.userId));

  if (orphanRows.length > 0) {
    console.log(
      `  • Przypisuję ${orphanRows.length} userów bez grupy do "Wszystkie moduły"`,
    );
    await db.insert(userGroups).values(
      orphanRows.map((u) => ({
        userId: u.id,
        groupId: fallbackGroupId,
      })),
    );
    for (const u of orphanRows) {
      console.log(`    - ${u.name}`);
    }
  } else {
    console.log("  • Wszyscy userzy mają już przypisaną grupę");
  }

  console.log("✅ Seed grup zakończony");
  process.exit(0);
}

seedGroups().catch((err) => {
  console.error("❌ Błąd:", err);
  process.exit(1);
});
