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

- [x] **Krok 6 M03 Zadania** — schema tasks (open/submitted/done), tRPC router (create, submit, updateStatus, update, delete, getById, list, stats), strona `/zadania` z filtrami i search, detail sheet, formularz tworzenia (tytuł, opis, jednostka, przypisanie, termin); workflow: manager tworzy → worker zgłasza wykonanie z opisem (submitted) → manager odbiera (done) lub cofa; dashboard ze statystykami zadań
- [x] **Synology NAS Upload** — klient FileStation API (DSM 7: SynoToken + _sid w URL, nie form body), API route `/api/files` (upload + proxy download), zdjęcia przy zgłoszeniu zadań z podglądem, pliki w `/JDK/JDK-Z4/Zdjecia/zadania/{user}_{task-slug}/`
- [x] **Etapy prac (stage_templates + unit_stages)** — checklista etapów per typ jednostki (apartment: 6 etapów, commercial: 5, parking: 1, storage: 1); auto-seed szablonów przy pierwszym otwarciu; optimistic updates; auto-sync statusu jednostki z etapów (all done→done, any issue→issue, mix→in_progress); progress bar w detail sheet
- [x] **Karty instalacyjne LU (PDF)** — podgląd PDF z NAS w detail sheet (split view: PDF na pełną lewą stronę + panel detali po prawej); mapowanie designatora → `ZAS4_MM_AR_INST_{designator}.pdf` z `/JDK/JDK-Z4/Projekt/08 Karty Katalogowe/5. KARTY INSTALACYJNE LU/PDF/`; link na mobile
- [x] **Integracja etapy ↔ Q&A** — kliknięcie wykrzyknika przy etapie: oznacza issue + redirect do Q&A z pre-fill (jednostka + nazwa etapu); kierownik przy zamykaniu pytania widzi checkboxy "Usuń problem z etapu" i może zresetować issue stages do pending
- [x] **Karty instalacyjne mieszkań i LU (PDF, 3 typy)** — pole `cardCode: text` na `units` (np. `A1.1.5` dla mieszkań, `A1.U.1` dla LU); seed `pnpm db:seed-cards` (klatka.piętro.lokalNaPiętrze dla mieszkań, designator dla LU); 3 zakładki w detail sheet: **Karta** / **Oświetlenie** / **Gniazda**; ścieżka NAS: `/JDK/JDK-Z4/Projekt/08 Karty Katalogowe/2. KARTY INSTALACYJNE/BUDYNEK {A|B}/PDF/{cardCode}/{cardCode}.{karta|osw|gn}.pdf`; numeracja kafelek/breadcrumbs używa cardCode (lokalna na piętrze) zamiast designatora globalnego; mutation `unit.updateCardCode` (manager+) z walidacją regex

- [x] **Krok 10 — Deploy produkcyjny (28.04.2026)** — Vercel + Supabase prod (`jdk-z4-prod`, region `fra1` Frankfurt), domena `https://app.jdkasprzak.pl` (A record `app` → `76.76.21.21` w easyisp DNS, cert SSL Let's Encrypt auto), proxy.ts dodaje `/dashboard` do `PROTECTED_PATHS`. **5 pułapek deployu** rozwiązanych: (1) `git log origin/main..HEAD` przed deployem; (2) Zod 4 + `.optional()` nie działa z `.min(1)` w `@t3-oss/env-core`; (3) `tsc` build w `@acme/api/db/validators` → no-op (pakiety konsumowane jako src); (4) Next.js 16 prerender wymaga `export const dynamic = "force-dynamic"` na `(dashboard)/layout.tsx`; (5) `turbo.json.globalEnv` MUSI zawierać każdą env var używaną w aplikacji — bez tego top-level `env.X.replace()` w route.ts wybucha w build phase
- [x] **Moduł Pliki + Indeks rysunków (28.04.2026)** — `Mapa Budynku` → `Projekt` (sidebar grupa rozwijalna z animacją: Mapa | Pliki). Pliki: `/api/files/list?path=...` z whitelistą `/JDK/JDK-Z4/`, FileBrowser z search po nazwie+opisie, filtr branży (ELE/TEL/SAN), 10 stałych kategorii tematycznych (Bud.A/B, Oświetlenie, Instalacje, Schemat/Widok rozdzielnicy, Odgromowa, Schemat zasilania, Garaż, Parter). Indeks rysunków: tabela `drawings` (fileCode unique per project, description, discipline, phase, revision), tRPC `drawing` router (lookupByCodes/list/import/clear z dedupe i `excluded.X` upsert), `/admin/drawings` z paste-JSON workflow (Claude.ai → JSON → preview → import) — bez bezpośredniego API call. FileBrowser dociąga opisy obok nazw PDF przez `extractDrawingCode()` (heurystyka: 9 segmentów `_`, 8. = typ rysunku `[A-Z]{3}`)
- [x] **Grupy uprawnień (28.04.2026)** — granularna kontrola widoczności modułów per user. Schema: `groups` (name unique), `group_modules` (groupId+moduleKey PK), `user_groups` (M:N). `MODULE_KEYS = ['mapa','pliki','zadania','qa']` w `@acme/validators` jako single source of truth. Admin (role=admin) widzi wszystko niezależnie od grup. User MUSI mieć ≥1 grupę przy tworzeniu (Zod `min(1)`). Sidebar filtruje po `group.myModules` (admin bypass), `useRequireModule()` guard w stronach. `/admin/groups` (CRUD + panel członków), `/admin/users` (multiselect grup + kolumna „Grupy"). Seed `pnpm db:seed-groups` tworzy „Wszystkie moduły" + „Tylko Q&A", przypisuje orphan userów (idempotentny)
- [x] **Fix indeksu rysunków — format 11 segmentów (03.05.2026)** — pliki PDF na NAS mają **11 segmentów** (`prefix_9 + numer_rysunku + minor_rev`, np. `..._SCH_XXX_07_01.pdf`), a `fileCode` z OPI (Claude.ai JSON) ma tylko 9. Stary `extractDrawingCode` brał 9 segmentów i gubił numer rysunku → wszystkie pliki ze schematami rozdzielnic mapowały się na ostatni wpis w DB ("Schemat rozdzielnicy oświetlenia zewnętrznego OT"). Fix: `extractDrawingCode` bierze **10 segmentów** (włącza numer rysunku z 10. pozycji); `expandFileCode` w `/admin/drawings` **dopisuje** numer z `revision` (NN_MM, padding 2 cyfr) jako 10. segment — działa identycznie dla rzutów (`OUZ_A00_X_RZU_P01` + `01_00` → `..._RZU_P01_01`) i schematów (`ROZ_XXX_X_SCH_XXX` + `07_01` → `..._SCH_XXX_07`). Dodatki: panel diagnostyki w `/admin/drawings` (czerwone wiersze = duplikat fileCode, żółte = duplikat opisu, statystyki rozszerzeń); toggle „kody" w file-browser (debug — pokazuje wyciągnięty kod pod nazwą); kolumna **„Rew."** z ostatnim segmentem nazwy (minor rewizji); zaktualizowany prompt template dla Claude.ai (fileCode = 9 segmentów, numer rysunku osobno w revision)
- [x] **Moduł Obecność (03–04.05.2026)** — `MODULE_KEYS` rozszerzony o `obecnosc`. Schema `attendance` (userId/projectId/date/checkedInAt/checkedOutAt/hoursWorked/note + unique). Worker wpisuje **godziny zegarowe HH:MM PL** (Europe/Warsaw, helper `combineDateAndTimePl` obsługuje DST), nie sumę godzin — `hoursWorked` liczone automatycznie z różnicy in-out (2 cyfry po przecinku). Reguła blokady: nie można `checkIn` na T jeśli T-1 ma rekord bez `checkedOutAt`; worker może uzupełnić wczoraj lub anulować rekord. Worker edytuje tylko T i T-1; manager/admin dowolnie. Strona `/obecnosc` z 3 tabami (Dziś — inline edycja czasów per user; Miesiąc — grid user×dni z sumą; Raport CSV — BOM UTF-8, separator `;`, format pracownik|firma|data|godziny|notatka). Widget na dashboardzie zawsze widoczny dla każdego zalogowanego (świadoma decyzja); strona/sidebar gated przez `obecnosc`. `staleTime` na `group.myModules` zmniejszony z 5min do 30s + refetchOnWindowFocus.
- [x] **Zadania: zdjęcie + powiązany plik z Projektu (04.05.2026)** — `tasks.creationPhotoPath` (zdjęcie managera przy tworzeniu) + `tasks.linkedFilePath` (1 plik z modułu Projekt). FileBrowser dostał propy `onSelect / pathOverride / onPathChange` (tryb selektora vs URL routing — back-compat dla `/mapa?tab=files`). `FilePickerDialog` w `components/zadania/` — modal z FileBrowserem, lokalny state ścieżki. TaskForm: pole zdjęcia (jak worker submit) + button „Wybierz plik z projektu" → modal. TaskDetailSheet: sekcja „Materiały" pokazuje zdjęcie managera (klikalne → full-size) + linked file z opisem (lookup w drawing index po `extractDrawingCode`). **Synology fix**: `ensureFolder` zdejmuje trailing slash z `basePath` (zapobiega `//` w ścieżce); `createOneFolder` rzuca błąd zamiast `console.warn` przy nieobsłużonych kodach (akceptuje 109 i 1100+408/414 jako „już istnieje"). **Synology Drive sync conflict** wykryty: `Zadania_ADMIN_<data>_Conflict` powstaje gdy `/JDK/JDK-Z4/` jest zsynchronizowane lokalnie — zalecenie: dodać `Zadania/*` do filtrów Drive Client (poza sync). Folder na NAS: `Zadania/{slug}-creation/` (manager) + `Zadania/{userName}_{taskSlug}/` (worker).
- [x] **Wymuszenie zmiany hasła (04.05.2026)** — pole `user.mustChangePassword: boolean default false`. Ustawiane na `true` przy: `seed-workers` (nowi), `admin.createUser`, `admin.resetPassword`. Mutation `auth.changeMyPassword` (Better Auth `changePassword`, `revokeOtherSessions: false` żeby user został zalogowany; min 6 znaków; ≠ stare). Query `auth.myMustChangePassword` jako `publicProcedure` (brak sesji → `false`, eliminuje UNAUTHORIZED przy hot reload). Strona `/zmiana-hasla` (top-level, własny layout) + `MustChangePasswordGuard` w `(dashboard)/layout.tsx` (client component, redirect.replace na `/zmiana-hasla` gdy flaga true). `proxy.ts` ma `/zmiana-hasla` w `PROTECTED_PATHS`. Seed `pnpm db:seed-workers` (z `dane/pracownicy.txt` — gitignored) + jednorazowy skrypt `reset-passwords.ts` używa `auth.$context.password.hash()` + bezpośredni update `account.password`.

**Do zrobienia (post-MVP):**
- [ ] Test PWA install na 2 telefonach (Android + iOS)
- [x] ~~Zmiana hasła `admin/admin` na prod~~ — zrobione ręcznie 04.05
- [ ] Rotacja sekretów wklejonych w sesji 28.04 (Supabase password, AUTH_SECRET, Synology password)
- [ ] (opcjonalne) Whitelist podfolderów w FileBrowser zamiast pełnego `/JDK/JDK-Z4/`
- [ ] Synology Drive Client: dodać `Zadania/*` do filtrów synchronizacji (jeśli `/JDK/JDK-Z4/` jest zsynchronizowane lokalnie)

**Deploy 04.05.2026 (po sesji obecność + zadania-fix + mustChangePassword):**
- Commit `5894e1f` → push → Vercel build Ready w 50s
- `cd packages/db && pnpm dotenv -e ../../.env.production.local -- drizzle-kit push --force` → schema (attendance, mustChangePassword, creationPhotoPath, linkedFilePath) na Supabase prod
- `pnpm dotenv -e ../../.env.production.local -- tsx src/seed-workers.ts` → 14 nowych + 1 update (Michał Rogalewski był wcześniej)
- `pnpm dotenv -e ../../.env.production.local -- tsx src/reset-passwords.ts` → wszystkim 15 ustawione `jdk2026` + `mustChangePassword=true`
- 15 pracowników JDK gotowi do pierwszego logowania na `app.jdkasprzak.pl`

---

## AUTH — JAK DZIAŁA

**Logowanie:** username (np. `jan.kowalski`) + hasło  
**Konto admin:** `admin` (hasło zmienione ręcznie na prod 04.05.2026)  
**Tworzenie userów:** Panel admina na `/admin/users` lub bulk seed `pnpm db:seed-workers` (czyta `dane/pracownicy.txt` — gitignored). **WYMAGANE: ≥1 grupa uprawnień przy tworzeniu** (multiselect)  
**Role (operacyjne):** `admin` | `manager` | `worker` — kontrolują CO user może robić (tworzyć zadania, zamykać Q&A, panel admin)  
**Grupy (widoczność):** kontrolują KTÓRE moduły user widzi w sidebarze. Role i grupy to ortogonalne wymiary.  
**Pola użytkownika:** name, username, email (auto), role, company (firma), lastSeenQaAt (powiadomienia), `mustChangePassword`  
**Wymuszenie zmiany hasła:** `mustChangePassword: boolean` ustawiane na `true` przy seedzie / `admin.createUser` / `admin.resetPassword`. `MustChangePasswordGuard` w dashboard layout robi `router.replace("/zmiana-hasla")`. Po zmianie flaga = false. Mutation `auth.changeMyPassword` (`revokeOtherSessions: false` żeby user został zalogowany). Query `auth.myMustChangePassword` jako `publicProcedure` (bez sesji → false, eliminuje UNAUTHORIZED przy hot reload).  
**Username auto-gen:** "Jan Kowalski" → `jan.kowalski` (polskie znaki → ASCII)  
**Wewnętrzny email:** `{username}@jdkz4.local` (wymagany przez Better Auth, ale niewidoczny dla usera)  
**minPasswordLength:** 4 znaki w Better Auth config; **`auth.changeMyPassword` wymaga min. 6** (Zod walidacja w validatorze)  
**Hasło startowe pracowników:** `jdk2026` (po seed-workers/reset-passwords) — wymuszona zmiana przy 1. logowaniu  
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
- `~/components/mapa/unit-detail-sheet.tsx` — panel szczegółów z checklistą etapów, progress bar, 3 zakładki PDF (Karta/Oświetlenie/Gniazda) + edycja cardCode
- `~/components/mapa/breadcrumbs.tsx` — nawigacja drill-down
- `~/components/mapa/status-filter.tsx` — 5 togglowych pigułek
- `~/components/qa/question-card.tsx` — karta pytania z timeago, status badge
- `~/components/qa/question-form.tsx` — formularz z pickerem jednostki
- `~/components/qa/question-detail-sheet.tsx` — szczegóły z odpowiadaniem
- `~/components/zadania/task-card.tsx` — karta zadania z deadline, przypisanie
- `~/components/zadania/task-form.tsx` — formularz tworzenia zadania
- `~/components/zadania/task-detail-sheet.tsx` — szczegóły z zgłoszeniem wykonania + upload zdjęcia
- `~/components/admin/edit-user-sheet.tsx` — edycja/usuwanie usera + reset hasła + multiselect grup
- `~/components/admin/group-multi-select.tsx` — reusable multi-checkbox lista grup z DB
- `~/components/mapa/file-browser.tsx` — przeglądarka plików NAS z search/filtry/kategorie. **Tryb selektora**: propy `onSelect`, `pathOverride`, `onPathChange` — bez nich URL routing dla `/mapa?tab=files`
- `~/components/zadania/file-picker-dialog.tsx` — modal pełnoekranowy z FileBrowserem w trybie selektora; lokalny state ścieżki
- `~/components/attendance/attendance-widget.tsx` — widget na dashbordzie, 4 stany (blokada T-1, „Jestem dziś", w toku, zamknięte). Czas wpisywany jako HH:MM PL, godziny liczone auto z różnicy
- `~/components/dashboard/must-change-password-guard.tsx` — client guard renderowany w `(dashboard)/layout.tsx`, redirect.replace na `/zmiana-hasla` gdy `auth.myMustChangePassword` zwróci `mustChange=true`
- `~/hooks/use-require-module.ts` — client-side guard `useRequireModule(moduleKey)` — redirect na dashboard przy braku uprawnień
- `~/lib/synology.ts` — klient Synology FileStation API (server-only) — login, upload, download, listFolder, ensureFolder (z `combineDateAndTimePl` dla obecności w `packages/api/src/router/attendance.ts`)
- `~/components/qa/question-detail-sheet.tsx` — szczegóły z odpowiadaniem + usuwanie problemów z etapów

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
[✅] Krok 6 → M03 Zadania — tworzenie, zgłaszanie wykonania (worker), odbiór (manager)
[✅] Synology NAS → Upload zdjęć do zadań przez FileStation API (DSM 7)
[✅] Etapy prac → stage_templates + unit_stages, checklista per jednostka, auto-sync statusu
[✅] Karty instalacyjne LU → PDF z NAS w split view detail sheet
[✅] Integracja etapy ↔ Q&A → zgłaszanie issue z etapu, usuwanie problemu przy zamykaniu Q&A
[✅] Karty instalacyjne mieszkań i LU → cardCode (A1.1.5 / A1.U.1), 3 zakładki PDF (karta/osw/gn), folder per jednostka
[✅] Krok 10 → Deploy na Vercel — app.jdkasprzak.pl (region fra1, A record w easyisp)
[✅] Pliki NAS w aplikacji → /mapa?tab=files (FileBrowser z search/filtry/kategorie tematyczne)
[✅] Indeks rysunków → tabela drawings + paste-JSON z Claude.ai w /admin/drawings; FileBrowser pokazuje opisy obok nazw PDF
[✅] Grupy uprawnień → MODULE_KEYS w validatorach, sidebar/guards filtrują, /admin/groups CRUD + multi-membership
[✅] Fix indeksu rysunków → 10 segmentów (włącza numer rysunku) + expandFileCode dopisuje numer z revision; kolumna „Rew." w file-browser; panel diagnostyki duplikatów w /admin/drawings
[✅] Moduł Obecność → schema attendance, godziny zegarowe HH:MM PL (DST-safe), reguła T-1, strona /obecnosc 3 taby (Dziś/Miesiąc/Raport CSV), widget na dashbordzie zawsze widoczny
[✅] Zadania: zdjęcie + linkedFile → creationPhotoPath + linkedFilePath; FilePickerDialog (modal); FileBrowser tryb selektora; sekcja Materiały w detail sheet
[✅] Synology fix: ensureFolder zdejmuje trailing slash + createOneFolder rzuca błąd; Drive sync conflict zdiagnozowany (Zadania_ADMIN_<data>_Conflict)
[✅] Wymuszenie zmiany hasła → user.mustChangePassword + /zmiana-hasla + MustChangePasswordGuard; seed-workers + reset-passwords skrypty
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
- `pnpm db:seed-cards` — przypisuje cardCode mieszkaniom i LU (klatka.piętro.lokalNaPiętrze dla mieszkań, designator dla LU; idempotentny)
- `pnpm db:seed-groups` — domyślne grupy uprawnień + przypisanie orphan userów (idempotentny). MODULE_KEYS w skrypcie hardcoded — pamiętać żeby aktualizować równolegle z `@acme/validators/modules.ts`
- `pnpm db:seed-workers` — czyta `dane/pracownicy.txt` (gitignored, `Imię Nazwisko | firma | rola | grupa`), tworzy/aktualizuje grupę „JDK" + 15 userów. Idempotentny: nowi z hasłem `jdk2026` + `mustChangePassword=true`; istniejący tylko firma/rola/grupy bez resetu hasła
- `packages/db/src/reset-passwords.ts` — jednorazowy skrypt: wszystkim oprócz admina ustawia `jdk2026` + `mustChangePassword=true`. Używa `auth.$context.password.hash()` z Better Auth + bezpośredni update tabeli `account.password` (bypassuje session admin)
- `packages/db/src/force-password-reset.ts` — utility: tylko ustawia flagę `mustChangePassword=true` bez ruszania haseł
- `pnpm db:fix-units` — czyści błędne jednostki (artefakty DWG: `A1.2.24`, `A1.2.30`, `B2.U.28`, `B2.U.29`)
- Wszystkie używają `tsx` (nie `ts-node`); ESM wymaga `import.meta.url + fileURLToPath` zamiast `__dirname`
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

**Etapy prac (stages):**
- `stage_templates` — szablony etapów, auto-seeded przy pierwszym `getForUnit` (nie seedem)
- `unit_stages` — instancje per jednostka, tworzone lazy przy otwarciu detail sheet
- Insert z `onConflictDoNothing()` — zapobiega race condition przy concurrent requests
- Status jednostki auto-sync z etapów: `syncUnitStatus()` w `stage.toggle` mutation
- Etapy per typ: apartment(6), commercial(5), parking(1), storage(1) — definicje w `STAGE_DEFINITIONS` w `packages/api/src/router/stage.ts`

**Drizzle — $onUpdateFn:**
- Przy `mode: "date"` na timestamp, `$onUpdateFn` musi zwracać `new Date()`, NIE `sql\`now()\`` — Drizzle próbuje `.toISOString()` na wartości i pada jeśli dostanie obiekt SQL

**Synology NAS (DS218j, DSM 7.1):**
- Adres: `http://193.163.149.230:5000` (port forwarding na routerze)
- Konto API: `admin` (wbudowane konto `jdkapp` nie miało uprawnień do API mimo grupy administrators)
- Env: `SYNOLOGY_URL`, `SYNOLOGY_USER`, `SYNOLOGY_PASS`, `SYNOLOGY_BASE_PATH` (uwaga: na localhoście od 03.05 ustawione na `/JDK/JDK-Z4/`, nie `/Zdjecia` — `ensureFolder` musi zdejmować trailing slash)
- **DSM 7 Upload quirk (KRYTYCZNE):** `_sid` NIE MOŻE być w multipart form body razem z plikiem — musi być w URL params. Bez tego error 119.
- Upload wymaga: `enable_syno_token=yes` przy loginie + header `X-SYNO-TOKEN` na operacjach zapisu
- Auth endpoint w DSM 7: `entry.cgi` (nie `auth.cgi` jak w DSM 6, choć `auth.cgi` też działa)
- Polskie znaki w ścieżkach folderów powodują problemy — używaj ASCII (`Zdjecia` nie `Zdjęcia`)
- **Wielkość liter się liczy** — foldery `BUDYNEK A`/`BUDYNEK B` są wielkimi literami (nie `Budynek A`), Synology zwraca 404 przy niezgodności
- **`ensureFolder` zdejmuje trailing slash** z `basePath` (`replace(/\/+$/, "")`) — bez tego `//` w ścieżce wywala 1100. **`createOneFolder` rzuca błąd** zamiast `console.warn` przy nieobsłużonych kodach; akceptuje 109 (top-level „już istnieje") oraz 1100+sub-error 408/414 (przy CreateFolder oznacza „już istnieje", nie „rodzic nie istnieje")
- **Synology Drive sync conflict** (04.05.2026): jeśli `/JDK/JDK-Z4/` jest zsynchronizowane lokalnie przez Synology Drive Client, tworzenie folderu przez aplikację może wywołać conflict resolution → folder dostaje suffix `_<USER>_<data>_Conflict` (np. `Zadania_ADMIN_May-04-...-2026_Conflict`). Fix: dodać `Zadania/*` do filtrów Drive Client, ALBO ustawić `SYNOLOGY_BASE_PATH` na share niezsynchronizowany. Tłumaczenie: aplikacja przez FileStation tworzy folder na NAS, lokalny Drive próbuje go zassać i wykrywa konflikt z lokalnym stanem
- Logging w `/api/files` route: `console.log("[upload] user=... folder=... file=... size=...")` przy każdym uploadzie + `[upload] OK → path` po sukcesie (dla debugu)
- Klient: `apps/nextjs/src/lib/synology.ts`, API route: `apps/nextjs/src/app/api/files/route.ts`

**Deploy Vercel (sesja 28.04.2026, 5 pułapek):**
- **Konto:** Vercel `jaceksk1`, project `jdk-z4-nextjs` w scope `jaceksk1s-projects`, region `fra1` (Frankfurt — ten sam co Supabase prod)
- **Domena:** `https://app.jdkasprzak.pl` — A record `app` → `76.76.21.21` w panelu easyisp.pl (NIE CNAME, Vercel preferuje A dla subdomeny gdy apex jest u innego hostingu); cert SSL Let's Encrypt auto. Apex `jdkasprzak.pl` zostaje na easyisp shared hosting (91.200.32.20).
- **Pułapka 1:** `git log origin/main..HEAD` ZAWSZE przed deployem — Vercel pulluje z GitHub, niepushnięte commity = build starego kodu
- **Pułapka 2 (Zod 4 + t3-env):** `.optional().min(1)` na string env wybucha "expected string, received undefined" — w `packages/auth/env.ts` opcjonalne env (`AUTH_DISCORD_ID` etc.) BEZ `.min(1)`
- **Pułapka 3 (monorepo build):** `@acme/api`, `@acme/db`, `@acme/validators` mają `"build": "echo no-op"` (nie `tsc`) — Better Auth produkuje nieprzenośne typy → `tsc` pada. Next.js i tak transpiluje przez `transpilePackages` w `next.config.js`.
- **Pułapka 4 (Next.js 16 prerender):** `useSearchParams()` na page wymaga `<Suspense>` lub `force-dynamic`. Fix: `export const dynamic = "force-dynamic"` w `apps/nextjs/src/app/(dashboard)/layout.tsx`
- **Pułapka 5 (turbo.json env):** Każda env var używana w aplikacji MUSI być w `turbo.json.globalEnv`, INACZEJ build wybuchnie przy "Collecting page data" (env undefined → `Cannot read properties of undefined (reading 'replace')`). Plus: NIGDY nie evaluuj env na top-level w `route.ts` — zawsze lazy w handlerze + `force-dynamic`
- **Schema na prod:** Vercel NIE robi migracji DB. Po pushu schemy: `cd packages/db && pnpm dotenv -e ../../.env.production.local -- drizzle-kit push --force`
- **Vercel CLI lokalne:** `vercel ls jdk-z4-nextjs --scope=jaceksk1s-projects` (lista deployów), `vercel inspect <URL> --logs` (pełny build log), `vercel domains add app.jdkasprzak.pl jdk-z4-nextjs` (dodanie domeny przez CLI zamiast UI)
- **Plik `.env.production.local`** (gitignored) — kompletne env do importu na Vercel przez "Import .env file"

**Pliki NAS + Indeks rysunków (sesja 28.04.2026):**
- **FileBrowser** (`/mapa?tab=files`) — czytany z NAS przez `SYNO.FileStation.List`, whitelistowane do `/JDK/JDK-Z4/` (path traversal blokowany regex `..`)
- **Drawings** — tabela `drawings` w DB, fileCode unique per project, paste-JSON workflow (Claude.ai parsuje DOC → JSON → admin wkleja w `/admin/drawings`); UPSERT z `excluded.X`, dedupe duplikatów PRZED INSERT (Postgres ON CONFLICT nie obsługuje dwukrotnego klucza w jednym INSERT)
- **extractDrawingCode (od 03.05.2026)** — bierze **10 segmentów** `_`, walidacja: 8. = `[A-Z]{3}` (RYS/SCH/WID/OPI...), 10. = `\d+` (numer rysunku). Format pliku NAS: 11 segmentów = 9 prefix + numer rysunku + minor rewizji (np. `6295_01_PW_ELE_ROZ_XXX_X_SCH_XXX_07_01.pdf` → kod `..._SCH_XXX_07`). 9. segment może być placeholderem (`XXX` w schematach rozdzielnic) lub konkretnym oznaczeniem (`G01`, `P01` w rzutach). Minor rewizji (11. segment) widoczny w UI w kolumnie „Rew.", ale nie wchodzi w klucz unique. Dyscyplino-agnostyczna — działa dla ELE, TEL, SAN itp.
- **expandFileCode** w `/admin/drawings` — fileCode w JSON z OPI ma 9 segmentów; doczepiamy 10. segment z `revision` (format `NN_MM` → `NN.padStart(2, "0")`). Działa identycznie dla rzutów z konkretnym 9. segmentem (`OUZ_A00_X_RZU_P01` + `01_00` → `..._RZU_P01_01`) i schematów z placeholderem XXX (`ROZ_XXX_X_SCH_XXX` + `07_01` → `..._SCH_XXX_07`). NIE zastępuje 9. segmentu — tylko dopisuje 10. (poprzednia wersja zastępowała XXX numerem, co psuło rzuty z konkretną kondygnacją)
- **TOPIC_FILTERS** w `file-browser.tsx` — 10 stałych kategorii (Bud.A/B, Oświetlenie, Instalacje, Schemat/Widok rozdzielnicy, Odgromowa, Schemat zasilania, Garaż, Parter) z patternami matchującymi opis case-insensitive

**Grupy uprawnień (sesja 28.04.2026):**
- **Schema:** `groups` (name unique), `group_modules` (M:N moduli), `user_groups` (M:N members) — admin (`user.role === 'admin'`) bypassuje wszystkie filtry, widzi każdy moduł
- **MODULE_KEYS:** `['mapa','pliki','zadania','qa','obecnosc']` w `@acme/validators/modules.ts` — single source of truth, używane w sidebarze, panelu grup, walidatorze grup, `useRequireModule`. Seed-groups ma własną hardcoded kopię — pamiętać o synchronizacji.
- **NavItem.moduleKey** — sidebar ukrywa item jeśli user nie ma modułu w `effectiveModules` (z `group.myModules` query)
- **useRequireModule()** — client-side guard hook w `/qa`, `/zadania`, `/mapa`, `/obecnosc` (mapa: warunkowo `mapa` lub `pliki` wg taba); redirect na `/dashboard` przy braku uprawnień
- **`group.myModules` cache:** `staleTime: 30s` + `refetchOnWindowFocus: true` (sidebar dodatkowo `refetchInterval: 60s`). Wcześniej było 5min — zmiana grup w panelu admin propagowała się 5min lub po wylogowaniu. Teraz w 30-60s.
- **createUser/updateUser** wymaga `groupIds.min(1)` — user nie może istnieć bez grupy. Seed-groups idempotentny: tworzy „Wszystkie moduły" + „Tylko Q&A", przypisuje orphan userów do „Wszystkie moduły".
- **Grupa „JDK"** (utworzona przez seed-workers, moduły: `mapa, zadania, qa`) — domyślna dla wszystkich 15 pracowników JDK Elektro
- **Page guard pattern dla client component:** ze `'use client'` nie da się server-side guarda — `useRequireModule()` ustawia `router.replace("/dashboard")` w `useEffect`, page returns `null` dopóki `hasAccess === false`
- **Widget Obecność** (`/components/attendance/attendance-widget.tsx`) — **świadomie poza systemem grup**, zawsze widoczny dla każdego zalogowanego (decyzja: każdy worker MUSI móc się odhaczyć; sam moduł `/obecnosc` z raportami jest gated)

**Obecność (sesja 03–04.05.2026):**
- Schema `attendance`: unique(userId, projectId, date) + `date` jako `t.date({mode: "string"})` (YYYY-MM-DD lokalna PL)
- **Strefa czasowa `Europe/Warsaw`** wszędzie: `Intl.DateTimeFormat("en-CA", {timeZone: "Europe/Warsaw"})` zwraca YYYY-MM-DD lokalne
- **Helper `combineDateAndTimePl(date, time)`** w `packages/api/src/router/attendance.ts` — buduje absolutny Date z `"2026-05-04" + "07:30"` interpretowanym jako PL. Działa wokół DST przez `Intl.DateTimeFormat.formatToParts` + offset reverse-engineering
- **`hoursWorked: numeric(4,2)`** liczone automatycznie z różnicy `checkedOutAt - checkedInAt` (`Math.round(ms/3600/1000 * 100) / 100` — 2 cyfry po przecinku). Worker NIE wpisuje godzin sumarycznie, tylko HH:MM zegarowe (in/out)
- **Reguła T-1**: `myToday.yesterdayBlocking = (yesterdayRecord && yesterdayRecord.checkedOutAt === null)` — worker musi uzupełnić wczoraj LUB anulować rekord (`attendance.cancel` mutation usuwa wpis). Worker edytuje tylko T i T-1; manager/admin dowolnie. `assertWorkerCanEditDate()` waliduje
- **Mutations:** `checkIn`, `checkOut` (auto stempluje czas), `setTimes` (HH:MM in/out, override + auto-recalc hoursWorked), `setNote`, `cancel`, manager: `listForDate`, `monthlyReport`, `exportMonth`
- **CSV format:** BOM UTF-8 (`﻿`), separator `;`, CRLF — Excel-friendly. Kolumny: `Pracownik;Firma;Data;Godziny;Notatka`
- **UI**: strona `/obecnosc` 3 taby (Dziś/Miesiąc/Raport), inline edycja czasów per user/dzień (HoursCell → TimeCell). Widget na dashbordzie zawsze widoczny
- **Better Auth `changePassword`** używa `revokeOtherSessions: false` — `true` wylogowuje TEŻ bieżącą sesję (mimo nazwy „other") i potem wszystkie protected query lecą jako UNAUTHORIZED
- **`auth.myMustChangePassword`** jako **publicProcedure** (a nie protected) — bez sesji zwraca `{mustChange: false}`. Bez tego guard sypie UNAUTHORIZED przy hot reload / wylogowaniu

**Zadania — zdjęcie + linkedFile (sesja 04.05.2026):**
- Schema `tasks` rozszerzona o `creationPhotoPath: text` (zdjęcie managera) + `linkedFilePath: text` (1 plik z modułu Projekt)
- **FileBrowser tryb selektora** (back-compat zachowane): propy `onSelect / pathOverride / onPathChange`. Bez nich URL routing dla `/mapa?tab=files`. Z nimi — modal-friendly (FilePickerDialog używa lokalnego state)
- **TaskForm**: pole zdjęcia (jak w worker submit) + button „Wybierz plik z projektu" → `FilePickerDialog` → wybrany plik z opisem (lookup w `drawing` po `extractDrawingCode`)
- **TaskDetailSheet** sekcja „Materiały": zdjęcie klikalne (full-size) + linked file z opisem rysunku (klikalny link → otwiera w nowej karcie przez `/api/files?path=`)
- Folder NAS: `Zadania/{slug}-creation/` (manager) + `Zadania/{userName}_{taskSlug}/` (worker, format z PROMPT-0)
- Ścieżka pełna z `SYNOLOGY_BASE_PATH=/JDK/JDK-Z4/`: `/JDK/JDK-Z4/Zadania/...` (UPPERCASE „Zadania")

**Karty mieszkań i LU (PDF):**
- Pole `cardCode: text` nullable na `units` — dla apartment i commercial
- Format: `{klatka}.{piętroDisplay}.{nrLokalnyNaPiętrze}` dla mieszkań (np. `A1.1.5`), `designator` dla LU (np. `A1.U.1`)
- Seed `pnpm db:seed-cards`: dla mieszkań grupuje po (klatka, floor.storey), sortuje natural po designatorze, numeruje 1..N lokalnie; dla LU cardCode = designator
- Rozkład pięter: A1: 1-6 (12,12,12,12,12,8); A2: 1-5 (10,12,12,12,12); B1: 1-6 (13,12,12,14,14,7); B2: 1-3 (9,12,7)
- Struktura na NAS: folder per jednostka, 3 typy plików: `{cardCode}.karta.pdf`, `{cardCode}.osw.pdf`, `{cardCode}.gn.pdf`
- Pełna ścieżka: `/JDK/JDK-Z4/Projekt/08 Karty Katalogowe/2. KARTY INSTALACYJNE/BUDYNEK {A|B}/PDF/{cardCode}/{cardCode}.{karta|osw|gn}.pdf`
- WAŻNE — nazwy plików BEZ prefiksu "M": `A1.1.5.osw.pdf` (NIE `A1.1.M5.osw.pdf`)
- Numeracja kafelek/breadcrumbs/header używa cardCode (lokalna na piętrze) zamiast designatora globalnego — w `displayDesignator` helperze tRPC (`row.cardCode ?? displayDesignator(...)`)
- Edycja ręczna: manager/admin w detail sheet → "Zmień" cardCode (regex walidacja: `^[AB][12]\.(?:U|\d+)\.\d+$`)
