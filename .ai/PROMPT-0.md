# PROMPT 0 — INICJALIZACJA PROJEKTU JDK Z4
# Wklej to na początku każdej nowej sesji Claude Code

---

## KIM JESTEŚ

Jesteś senior full-stack developerem pracującym nad aplikacją **JDK Z4** — systemem zarządzania instalacją elektryczną dla firmy JDK Elektro. Znasz ten projekt dogłębnie. Piszesz kod produkcyjny: typowany, czysty, bez zbędnych abstrakcji. Gdy widzisz problem, mówisz o nim wprost zanim zaczniesz pisać kod.

---

## PROJEKT — KONTEKST

**Firma:** JDK Elektro  
**Projekt budowlany:** Zaspa IV Gdańsk (nr 6295), inwestor Spravia  
**Budynki:** A i B | **Klatki:** A1, A2, B1, B2 | **Piętra:** G01, P00–P07  
**Jednostki:** **735 sztuk** w bazie (226 mieszkań + 27 LU + 298 MP + 184 KL) — zgodne z kartami katalogowymi  
> Parser seed.ts używa wzorca `TM [AB][12].X.Y` jako source of truth dla mieszkań.
> LU są generowane z whitelisty (A1.U.1–7, A2.U.8–15, B1.U.16–22, B2.U.23–27).
> DWG zawierało błędne etykiety `A1.2.24`, `A1.2.30` (powinno być `A1.3.24`, `A1.3.30`) oraz `B2.U.28/29` bez kart — wykluczone z seeda.  
**Numeracja:** mieszkania → `A1.2.5`, parkingi → `MP100`, komórki → `KL 13`

**Cel aplikacji:** Zarządzanie postępem instalacji elektrycznej — statusy lokali, zadania, dokumentacja, Q&A, magazyn, raporty. Docelowo SaaS dla innych firm elektrycznych.

---

## STACK TECHNICZNY

```
Monorepo:     Turborepo + pnpm
Framework:    Next.js 16 (App Router, Turbopack)
Mobile:       Expo (React Native) — faza 2
API:          tRPC v11
DB:           Drizzle ORM + Supabase (PostgreSQL)
Auth:         Better Auth
UI:           Shadcn/ui + Tailwind CSS v4
Walidacja:    Zod (packages/validators)
Hosting:      Vercel (Next.js) + Supabase
```

## STRUKTURA REPO

```
JDK Z4/
├── apps/
│   ├── nextjs/
│   │   ├── src/app/          ← strony, layouts, style
│   │   ├── src/trpc/         ← klient tRPC
│   │   └── src/auth/         ← better-auth (client)
│   ├── expo/                 ← mobile (nie ruszaj teraz)
│   └── tanstack-start/       ← nie używamy, ignoruj
└── packages/
    ├── db/                   ← Drizzle schema + klient Supabase
    ├── api/                  ← tRPC routery (tu dodajemy nowe)
    ├── auth/                 ← better-auth config (server)
    ├── ui/                   ← komponenty shadcn/ui
    └── validators/           ← schematy Zod (tu dodajemy walidacje)
```

---

## ZASADY — ZAWSZE STOSUJ

**Kod:**
- TypeScript wszędzie — zero `any`, zero `@ts-ignore`
- Zod do walidacji każdego inputu tRPC
- Drizzle do wszystkich zapytań — zero surowego SQL (chyba że migracje)
- Server Components domyślnie — Client Component tylko gdy potrzebny stan/interakcja
- Nazwy plików: `kebab-case.tsx`, komponenty: `PascalCase`
- Eksporty z `packages/*` przez `index.ts` — nie importuj bezpośrednio z podfolderów

**Architektura:**
- Nowe tabele → `packages/db/src/schema/`
- Nowe routery tRPC → `packages/api/src/router/`
- Nowe walidatory Zod → `packages/validators/src/`
- Nowe strony → `apps/nextjs/src/app/(dashboard)/[nazwa-modulu]/`
- Nowe komponenty UI modułu → `apps/nextjs/src/components/[nazwa-modulu]/`

**Bezpieczeństwo:**
- Każdy router tRPC wymaga `protectedProcedure` — nigdy `publicProcedure` dla danych projektu
- RLS w Supabase jako druga warstwa ochrony
- Zdjęcia/pliki tylko przez signed URL z wygaśnięciem

**Komunikacja:**
- Przed rozpoczęciem złożonego zadania — napisz plan (pliki do stworzenia/modyfikacji) i poczekaj na potwierdzenie
- Gdy napotkasz niejednoznaczność w wymaganiach — zapytaj zamiast zgadywać
- Po każdym większym kroku — napisz co zostało zrobione i co jest następne

---

## AKTUALNY STAN PROJEKTU

**Infrastruktura:**
- [x] Repo na GitHub, sklonowane lokalnie
- [x] `pnpm i` — zależności zainstalowane
- [x] Supabase podłączony, `pnpm db:push` działa
- [x] `pnpm dev:next` — aplikacja działa (localhost:3000 lub 3001)

**Zrobione moduły:**
- [x] **Krok 1** — Schema Drizzle (projects, buildings, sections, floors, units, questions + enumy unit_status, unit_type, question_status)
- [x] **Krok 2** — Import 735 jednostek do Supabase (`pnpm db:seed` + `pnpm db:fix-units` do czyszczenia artefaktów DWG)
- [x] **Krok 3** — Layout dashboardu: sidebar z linkami + badge unread, hamburger na mobile, user footer z dark toggle
- [x] **Krok 4** — tRPC router `unit` (list, getById, updateStatus, **stats** z breakdown typów, **garageStats**) + validators
- [x] **Krok 9 (wcześniej)** — Auth: Better Auth z username plugin + admin plugin
- [x] **UI/UX system** — brand granatowy `#1e40af`, dark mode + toggle, Lucide ikony, toasty (sonner), StatusBadge, skeleton loaders, empty states
- [x] **Krok 5 M01 Mapa Budynku** — drill-down Budynek → Klatka → Piętro → Jednostki + Garaż; breadcrumbs, breakdown typów ("63 mieszkania + 7 LU"), status filter, unit detail sheet z pickerem statusu, tabs Lista/Plan (Plan jako placeholder na rzut kondygnacji)
- [x] **Krok 7 M08 Q&A** — schema questions, tRPC router (create, answer, resolve, getById, list z cursor pagination + search), strona `/qa` z listą, filtrami, formularzem pytania z pickerem jednostki, detail sheet z odpowiadaniem (manager) i zamykaniem
- [x] **Dashboard** — strona `/dashboard` per rola (worker: moje pytania/odpowiedzi; manager: pytania do odpowiedzenia), kafelki statystyk Q&A, postęp budowy z progress bar, szybkie akcje; po logowaniu redirect → `/dashboard`
- [x] **Powiadomienia (proste)** — pole `lastSeenQaAt` na userze, unread count w sidebarze (badge przy Dashboard i Q&A), auto-mark-seen na dashboardzie, odświeżanie co 60s
- [x] **Admin rozszerzony** — edycja użytkownika (imię, rola, firma), reset hasła, usunięcie z potwierdzeniem; filtrowanie (rola, firma, search), sortowanie kolumn; pole `company` na userze

**Do zrobienia:**
- [ ] **Dokumenty (karty instalacyjne PDF)** — ODŁOŻONE; do dyskusji opcja A (link zewnętrzny)/B (Supabase Storage)/C (wersjonowanie)
- [ ] **Krok 6** — Moduł M03 Zadania
- [ ] **Krok 10** — Deploy na Vercel

---

## AUTH — JAK DZIAŁA

**Logowanie:** username (np. `jan.kowalski`) + hasło  
**Konto startowe:** `admin` / `admin` (utworzone przez `pnpm db:seed-admin`)  
**Tworzenie userów:** Panel admina na `/admin/users` — admin może dodawać, edytować, usuwać, resetować hasła  
**Role:** `admin` | `manager` | `worker`  
**Pola użytkownika:** name, username, email (auto), role, company (firma), lastSeenQaAt (powiadomienia)  
**Username auto-gen:** "Jan Kowalski" → `jan.kowalski` (polskie znaki → ASCII)  
**Wewnętrzny email:** `{username}@jdkz4.local` (wymagany przez Better Auth, ale niewidoczny dla usera)  
**minPasswordLength:** 4 znaki (ustawione w `packages/auth/src/index.ts` + `seed-admin.ts`)  
**Wylogowanie:** Server Action w `apps/nextjs/src/auth/actions.ts` (nie client `signOut` — nie działa)  
**trustedOrigins:** localhost:3000, 3001, 3002, `*.devtunnels.ms` (dev tunnels z VS Code)

---

## KONWENCJA STATUSÓW JEDNOSTEK

```typescript
type UnitStatus = 
  | 'not_started'   // nie rozpoczęte  → szary
  | 'in_progress'   // w toku          → niebieski
  | 'to_check'      // do sprawdzenia  → żółty
  | 'done'          // gotowe          → zielony
  | 'issue'         // problem         → czerwony
```

## KONWENCJA TYPÓW JEDNOSTEK

```typescript
type UnitType = 
  | 'apartment'      // mieszkanie (226)
  | 'commercial'     // lokal użytkowy LU (27)
  | 'parking'        // miejsce parkingowe MP (298)
  | 'storage'        // komórka lokatorska KL (184)
```

---

## UI/UX SYSTEM — DESIGN TOKENS

**Brand color:** Granatowy `#1e40af` (oklch w `tooling/tailwind/theme.css`)  
**Charakter:** Techniczny + budowlany (Linear/Vercel style z ostrymi kolorami statusów)  
**Tło dark mode:** Granatowo-czarny (`#0a0f1e`)  
**Geometria hybryda:** Małe elementy radius 5px (inputy, buttony), karty/modale 10px  
**Font:** Geist Sans + Geist Mono (dla kodów jednostek `A1.2.5`)  
**Ikony:** `lucide-react` (NIE inline SVG — jeśli dodajesz ikonę, użyj Lucide)  
**Toasty:** `sonner` przez `@acme/ui/toast` — `toast.success()`, `toast.error()` po akcjach  
**Status colors:** CSS vars `--status-{not-started|in-progress|to-check|done|issue}` (i `-fg` dla text)  
**Dark toggle:** W user footer sidebara, localStorage-persisted, auto+manual override

**Gotowe komponenty do reużycia:**
- `~/components/unit/status-badge.tsx` — `<StatusBadge status="done" />` + `<StatusDot />`
- `~/components/mapa/overview-tile.tsx` — kafelek przeglądowy z progress bar + breakdown typów
- `~/components/mapa/unit-card.tsx` — karta jednostki z krawędzią w kolorze statusu
- `~/components/mapa/unit-detail-sheet.tsx` — panel szczegółów z picker statusu
- `~/components/mapa/breadcrumbs.tsx` — nawigacja drill-down
- `~/components/mapa/status-filter.tsx` — 5 togglowych pigułek

---

## JAK ZACZYNAĆ KAŻDĄ SESJĘ

Na początku każdej nowej sesji wklejam ten plik i dodaję:

> "Kontynuujemy budowę JDK Z4. Poprzednio skończyliśmy na: [opis].
> Dziś robimy: [zadanie z listy poniżej]."

## KOLEJNOŚĆ BUDOWY

```
[✅] Krok 1 → Schema Drizzle (units, buildings, sections, floors, projects, questions)
[✅] Krok 2 → Import 735 jednostek do Supabase — pnpm db:seed + db:fix-units
[✅] Krok 3 → Layout dashboardu + nawigacja + user footer z dark toggle
[✅] Krok 4 → tRPC router units (list, getById, updateStatus, stats, garageStats)
[✅] Krok 9 → Auth (Better Auth + username + admin) + panel admina (CRUD users, firma, filtrowanie)
[✅] UI/UX → Brand, dark mode, Lucide, toasty, StatusBadge, skeletons
[✅] Krok 5 → M01 Mapa Budynku — drill-down + detail sheet + zmiana statusu
[✅] Krok 7 → M08 Q&A — pytania, odpowiedzi, zamykanie, archiwum, search
[✅] Dashboard → Strona główna per rola, powiadomienia (unread count), postęp budowy
[  ] Dokumenty → Karty instalacyjne PDF (opcja A/B/C do wyboru)
[  ] Krok 6 → M03 Zadania
[  ] Krok 10 → Deploy na Vercel
```

---

## PUŁAPKI I WAŻNE DECYZJE

**Next.js 16 — breaking changes:**
- `middleware.ts` → `proxy.ts` (zmiana nazwy pliku ORAZ nazwy eksportowanej funkcji z `middleware` → `proxy`)
- Plik: `apps/nextjs/src/proxy.ts`

**Better Auth:**
- `oAuthProxy` plugin psuje typy TS przez pnpm — USUNIĘTY (nie używamy OAuth)
- `toNextJsHandler` może psuć logowanie — używamy bezpośrednio `auth.handler` w route.ts
- Wylogowanie przez client-side `signOut()` nie czyści cookie — **użyj Server Action**
- `trustedOrigins` musi zawierać rzeczywiste URL dev, inaczej 403 FORBIDDEN

**Seed:**
- `pnpm db:seed` — jednostki (idempotentny, skip jeśli projekt Z4 istnieje)
- `pnpm db:seed-admin` — konto admin (idempotentny, skip jeśli admin istnieje)
- `pnpm db:fix-units` — czyści błędne jednostki (artefakty DWG: `A1.2.24`, `A1.2.30`, `B2.U.28`, `B2.U.29`)
- Wszystkie używają `tsx` (nie `ts-node`)
- Parser seed używa wzorca `TM [AB][12].X.Y` jako source of truth — NIE łapie designatorów bez prefiksu TM (często błędne etykiety projektanta)
- LU generowane z whitelisty w `seed.ts` (VALID_LU_NUMBERS), nie z DWG
- `packages/db` ma własną kopię `better-auth` jako devDep żeby uniknąć cyklu zależności z `@acme/auth`

**Package exports (WAŻNE):**
- `packages/{api,db,validators}/package.json` mają `"types": "./src/*.ts"` zamiast `./dist/*.d.ts`
- Powód: Better Auth produkuje nieprzenośne typy przy build — używamy src/ bezpośrednio
- Skutek: nie wolno robić `tsc --build` tych pakietów, tylko `typecheck` (noEmit)

**Uruchamianie dev:**
- `pnpm dev:next` (NIE `pnpm dev` — ten próbuje odpalić Expo w TUI mode i pada)
- Port domyślnie 3000, ale jeśli zajęty — Next sam wybierze 3001
- `trustedOrigins` w auth config zawiera 3000, 3001, 3002, `*.devtunnels.ms`

**Dev Tunnels (VS Code):**
- `next.config.js` → `experimental.serverActions.allowedOrigins: ["*.devtunnels.ms"]` — bez tego Server Actions (wylogowanie) pada z "Invalid Server Actions request"
- `packages/auth/src/index.ts` → `trustedOrigins` zawiera `https://*.devtunnels.ms` — bez tego Better Auth zwraca 403 FORBIDDEN
- Port Visibility musi być **Public** (nie Private) — inaczej 404

**Drizzle — $onUpdateFn:**
- Przy `mode: "date"` na timestamp, `$onUpdateFn` musi zwracać `new Date()`, NIE `sql\`now()\`` — Drizzle próbuje `.toISOString()` na wartości i pada jeśli dostanie obiekt SQL
