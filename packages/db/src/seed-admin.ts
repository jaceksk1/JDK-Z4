/**
 * Tworzy konto admin — uruchamiaj raz (lub gdy brak konta admin).
 * Uruchomienie: pnpm db:seed-admin
 *
 * Używamy Better Auth bezpośrednio (bez importu @acme/auth) żeby uniknąć
 * cyklu zależności packages/db ↔ packages/auth.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "./client";
import { user } from "./schema";

async function seedAdmin() {
  const existing = await db.query.user.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.username, "admin"),
  });

  if (existing) {
    console.log("⚠️  Konto admin już istnieje — pomijam");
    console.log(`   ID: ${existing.id}`);
    process.exit(0);
  }

  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: "http://localhost:3000",
    secret: process.env.AUTH_SECRET ?? "seed-secret",
    emailAndPassword: { enabled: true, minPasswordLength: 4 },
    plugins: [
      username(),
      admin({ defaultRole: "worker", adminRoles: ["admin"] }),
    ],
  });

  const result = await auth.api.signUpEmail({
    body: {
      email: "admin@jdkz4.local",
      password: "admin",
      name: "Administrator",
      username: "admin",
    },
    headers: new Headers(),
    asResponse: false,
  });

  if (!result?.user?.id) {
    console.error("❌ Nie udało się utworzyć konta admin");
    process.exit(1);
  }

  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, result.user.id));

  console.log("✅ Konto admin utworzone");
  console.log("   Login: admin");
  console.log("   Hasło: admin");
  console.log("   ⚠️  Zmień hasło po pierwszym logowaniu!");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Błąd:", err);
  process.exit(1);
});
