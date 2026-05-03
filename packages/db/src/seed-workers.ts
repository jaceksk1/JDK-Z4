/**
 * Seed pracowników z pliku dane/pracownicy.txt + grupa "JDK".
 * Uruchomienie: pnpm db:seed-workers
 *
 * Format wiersza pliku: "Imię Nazwisko | firma | rola | grupa"
 *
 * Idempotentny:
 *  - Grupa "JDK" — tworzona/aktualizowana z modułami: mapa, zadania, qa
 *  - Istniejący użytkownicy: aktualizowane są firma/rola, grupy reset+insert; hasło NIE zmieniane
 *  - Nowi użytkownicy: tworzeni z hasłem startowym (zmieniają sami przy 1. logowaniu)
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, username as usernamePlugin } from "better-auth/plugins";
import { eq, inArray } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { db } from "./client";
import { groupModules, groups, user, userGroups } from "./schema";

const STARTING_PASSWORD = "jdk2026";
const GROUP_NAME = "JDK";
const GROUP_MODULES = ["mapa", "zadania", "qa"] as const;
const GROUP_DESCRIPTION = "Pracownicy JDK Elektro — mapa, zadania, Q&A";

interface WorkerRow {
  fullName: string;
  company: string;
  role: "worker" | "manager" | "admin";
  groupName: string;
}

function parseRow(line: string, lineNo: number): WorkerRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const parts = trimmed.split("|").map((s) => s.trim());
  if (parts.length < 4) {
    console.warn(`  ⚠️  L${lineNo}: pominięto (oczekiwane 4 kolumny): ${line}`);
    return null;
  }
  const [fullName, company, role, groupName] = parts;
  if (!fullName || !company || !role || !groupName) {
    console.warn(`  ⚠️  L${lineNo}: pominięto (puste pole): ${line}`);
    return null;
  }
  if (role !== "worker" && role !== "manager" && role !== "admin") {
    console.warn(`  ⚠️  L${lineNo}: nieznana rola "${role}", używam "worker"`);
    return { fullName, company, role: "worker", groupName };
  }
  return { fullName, company, role: role as WorkerRow["role"], groupName };
}

/** "Jan Kowalski" → "jan.kowalski"; polskie znaki → ASCII */
function generateUsername(fullName: string): string {
  const map: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n",
    ó: "o", ś: "s", ź: "z", ż: "z",
    Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n",
    Ó: "o", Ś: "s", Ź: "z", Ż: "z",
  };
  return fullName
    .toLowerCase()
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => map[c] ?? c)
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

async function ensureGroup(): Promise<string> {
  const existing = await db.query.groups.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.name, GROUP_NAME),
  });

  let groupId: string;
  if (existing) {
    console.log(`  • Grupa "${GROUP_NAME}" już istnieje — aktualizuję moduły`);
    groupId = existing.id;
    await db.delete(groupModules).where(eq(groupModules.groupId, groupId));
  } else {
    const [created] = await db
      .insert(groups)
      .values({ name: GROUP_NAME, description: GROUP_DESCRIPTION })
      .returning();
    if (!created) throw new Error(`Nie udało się utworzyć grupy ${GROUP_NAME}`);
    groupId = created.id;
    console.log(`  ✅ Utworzono grupę "${GROUP_NAME}"`);
  }

  await db
    .insert(groupModules)
    .values(GROUP_MODULES.map((k) => ({ groupId, moduleKey: k })));

  return groupId;
}

async function seedWorkers() {
  console.log("🌱 Seed pracowników...\n");

  // 1. Wczytaj plik
  const filePath = resolve(__dirname, "../../../dane/pracownicy.txt");
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    console.error(`❌ Nie znaleziono pliku ${filePath}`);
    process.exit(1);
  }
  const lines = raw.split(/\r?\n/);
  const rows: WorkerRow[] = [];
  lines.forEach((line, i) => {
    const r = parseRow(line, i + 1);
    if (r) rows.push(r);
  });
  if (rows.length === 0) {
    console.error("❌ Brak prawidłowych wierszy w pliku");
    process.exit(1);
  }
  console.log(`📖 Wczytano ${rows.length} pracowników z pliku\n`);

  // 2. Grupa
  const groupId = await ensureGroup();
  console.log("");

  // 3. Better Auth instance (do tworzenia nowych userów)
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: "http://localhost:3000",
    secret: process.env.AUTH_SECRET ?? "seed-secret",
    emailAndPassword: { enabled: true, minPasswordLength: 4 },
    plugins: [
      usernamePlugin(),
      adminPlugin({ defaultRole: "worker", adminRoles: ["admin"] }),
    ],
  });

  // 4. Iteruj po pracownikach
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const usernameStr = generateUsername(row.fullName);
    const email = `${usernameStr}@jdkz4.local`;

    try {
      const existing = await db.query.user.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.username, usernameStr),
      });

      if (existing) {
        // Update istniejącego: firma + rola; grupy reset+insert; hasło NIE zmieniane
        await db
          .update(user)
          .set({
            name: row.fullName,
            company: row.company,
            role: row.role,
          })
          .where(eq(user.id, existing.id));

        await db
          .delete(userGroups)
          .where(eq(userGroups.userId, existing.id));
        await db
          .insert(userGroups)
          .values({ userId: existing.id, groupId });

        console.log(
          `  🔄 ${row.fullName.padEnd(28)} (${usernameStr}) — zaktualizowany`,
        );
        updated++;
      } else {
        // Nowy user — przez Better Auth signUpEmail
        const result = await auth.api.signUpEmail({
          body: {
            email,
            password: STARTING_PASSWORD,
            name: row.fullName,
            username: usernameStr,
          },
          headers: new Headers(),
          asResponse: false,
        });

        if (!result?.user?.id) {
          throw new Error("signUpEmail zwrócił pusty user");
        }

        await db
          .update(user)
          .set({
            role: row.role,
            company: row.company,
            mustChangePassword: true,
          })
          .where(eq(user.id, result.user.id));

        await db
          .insert(userGroups)
          .values({ userId: result.user.id, groupId });

        console.log(
          `  ✅ ${row.fullName.padEnd(28)} (${usernameStr}) — utworzony`,
        );
        created++;
      }
    } catch (err) {
      errors++;
      console.error(
        `  ❌ ${row.fullName.padEnd(28)} (${usernameStr}) — ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  // 5. Raport
  console.log("\n──────────────────────────────────────");
  console.log(`✅ Utworzonych:   ${created}`);
  console.log(`🔄 Zaktualizowanych: ${updated}`);
  if (errors > 0) console.log(`❌ Błędów:        ${errors}`);
  console.log("──────────────────────────────────────");
  if (created > 0) {
    console.log(
      `\n🔑 Hasło startowe dla nowych kont: "${STARTING_PASSWORD}"`,
    );
    console.log(
      "   Pracownicy mają je zmienić przy pierwszym logowaniu.",
    );
  }
  process.exit(errors > 0 ? 1 : 0);
}

seedWorkers().catch((err) => {
  console.error("❌ Błąd:", err);
  process.exit(1);
});
