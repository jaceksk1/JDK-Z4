/**
 * Jednorazowy skrypt — resetuje hasła WSZYSTKICH userów (oprócz admina)
 * do hasła startowego "jdk2026" + ustawia mustChangePassword=true.
 *
 * Uruchomienie: cd packages/db && pnpm with-env tsx src/reset-passwords.ts
 *
 * UWAGA: nieodwracalne. Dotychczasowe hasła zostaną nadpisane.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, username as usernamePlugin } from "better-auth/plugins";
import { eq, ne } from "drizzle-orm";

import { db } from "./client";
import { account, user } from "./schema";

const NEW_PASSWORD = "jdk2026";

async function main() {
  console.log(`🔑 Reset haseł — wszystkim oprócz admina ustawiam "${NEW_PASSWORD}"\n`);

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

  const authCtx = await auth.$context;
  const hashed = await authCtx.password.hash(NEW_PASSWORD);

  const targets = await db
    .select({ id: user.id, name: user.name, username: user.username })
    .from(user)
    .where(ne(user.username, "admin"));

  if (targets.length === 0) {
    console.log("Brak userów do resetu (tylko admin w bazie).");
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;

  for (const u of targets) {
    // Zaktualizuj wszystkie wpisy account z password (Better Auth używa providerId='credential')
    const res = await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(account.userId, u.id))
      .returning({ id: account.id });

    await db
      .update(user)
      .set({ mustChangePassword: true })
      .where(eq(user.id, u.id));

    if (res.length === 0) {
      console.log(
        `  ⚠️  ${u.name.padEnd(28)} (${u.username}) — brak rekordu account, pominięty`,
      );
      skipped++;
    } else {
      console.log(
        `  ✅ ${u.name.padEnd(28)} (${u.username}) — zresetowane (${res.length} account)`,
      );
      updated++;
    }
  }

  console.log("\n──────────────────────────────────────");
  console.log(`✅ Zresetowanych: ${updated}`);
  if (skipped > 0) console.log(`⚠️  Pominiętych:  ${skipped}`);
  console.log("──────────────────────────────────────");
  console.log(`\n🔑 Nowe hasło: ${NEW_PASSWORD}`);
  console.log("   Wszyscy zostali oznaczeni do zmiany hasła przy następnym logowaniu.");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
