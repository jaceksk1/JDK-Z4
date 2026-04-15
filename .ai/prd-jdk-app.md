# PRD — JDK App
**Wersja:** 1.0 | **Data:** 2026-04-14 | **Właściciel:** Kierownik JDK (inicjator) | **Status:** Finalny

---

## Streszczenie Dla Zarządu

Budujemy aplikację webową (PWA) dla firmy JDK, w której pracownicy budowy zadają pytania techniczne powiązane z konkretnym projektem i dostają odpowiedzi od kierownika — widoczne dla całego zespołu, archiwizowane i przeszukiwalne.

Cel mierzalny: spadek liczby błędów wykonawczych o 30% w ciągu 90 dni od wdrożenia na projekcie Z4. Proxy: 80% pytań projektowych trafia do aplikacji zamiast na Signal po 60 dniach.

Dlaczego teraz: firma rośnie, chaos komunikacyjny na Signalu rośnie szybciej niż firma. Szefowie widzą problem i popierają rozwiązanie. Koszt niedziałania: kierownik jako permanentne wąskie gardło blokuje skalowanie.

Kryterium zatrzymania: jeśli po 6 tygodniach od wdrożenia mniej niż 5 pracowników użyło aplikacji do zadania pytania — hipoteza o adopcji jest błędna.

---

## FAZA 1 — FUNDAMENT

### 1.1 Podstawowa Hipoteza

> Wierzymy, że **pracownicy budowy i podwykonawcy małej firmy elektrycznej** mają problem z **brakiem szybkiego dostępu do odpowiedzi na pytania projektowe — przez co popełniają błędy wykonawcze i tracą czas na telefonowanie do kierownika**.
>
> Jeśli zbudujemy **aplikację, w której pracownik zadaje pytanie powiązane z konkretnym projektem i otrzymuje odpowiedź od kierownika lub z bazy wiedzy w czasie poniżej 15 minut**, spodziewamy się, że **liczba błędów wykonawczych wymagających poprawek** zmniejszy się o **co najmniej 30%** w ciągu **3 miesięcy od wdrożenia**.
>
> Będziemy wiedzieć, że się mylimy, jeśli **pracownicy nadal używają Signala do zadawania pytań projektowych po 6 tygodniach od wdrożenia**. `[ZAŁOŻENIE]`

**Największe ryzyko:** Kierownik jest wąskim gardłem — jeśli nie odpowiada wystarczająco szybko, pracownicy wrócą do Signala. `[ZAŁOŻENIE]`

**Kluczowe zachowanie, które musi być prawdziwe:** Pracownicy muszą być gotowi wpisywać pytania tekstowo zamiast dzwonić. `[ZAŁOŻENIE]`

---

### 1.2 Narracja Przed / Po

**Przed**

Marek, elektryk na budowie mieszkaniowej, stoi przy tablicy rozdzielczej na 3. piętrze. Ma przed sobą projekt PDF, który ktoś wysłał na Signalu trzy dni temu — gdzieś w historii wiadomości, między listą obecności a zdjęciem faktury. Nie może go znaleźć. Dzwoni do kierownika. Kierownik jest na spotkaniu w biurze. Marek czeka 40 minut, robi coś innego, wraca — i montuje przewód nie w tej trasie co trzeba. Błąd wychodzi przy odbiorze. Dwie godziny poprawki, klient niezadowolony, kierownik zdenerwowany.

**Po**

Marek otwiera aplikację, wybiera projekt „Zaspa IV, mieszkanie 3B", pisze: „Która trasa dla obwodu gniazd łazienkowych?" Widzi schemat dołączony do projektu. Jeśli nie wystarcza — wysyła pytanie, kierownik odpowiada między spotkaniami z telefonu. Marek montuje dobrze za pierwszym razem.

> „JDK App istnieje po to, aby Marek mógł **dostać właściwą odpowiedź przed tym, jak wbije pierwszy wkręt**, zamieniając **chaos w Signal i czekanie na oddzwonienie** w **30-sekundowe sprawdzenie w aplikacji**."

---

### 1.3 Czerwony Zespół — Argumenty Przeciwko Budowaniu

1. **Ryzyko rynkowe:** Signal działa. Jest na każdym telefonie. Jest za darmo. Pracownicy budowlani nie są early adopterami — nowe narzędzie musi być natychmiastowo prostsze.
2. **Ryzyko wykonania:** Jedna osoba bez doświadczenia fullstack buduje web + mobile + panel admina + Q&A. Ryzyko niedokończenia lub zbudowania czegoś, co nie robi nic dobrze.
3. **Ryzyko strategiczne:** Gotowe narzędzia (Buildertrend, PlanGrid, Notion) istnieją. Budowanie własnego zamiast konfiguracji gotowego wymaga świadomego uzasadnienia.
4. **Ryzyko adopcji:** 15 pracowników musi zmienić nawyk. Bez twardego mandatu od szefów — nie zmienią.
5. **Niezamierzone konsekwencje:** Dane projektowe (schematy, kosztorysy) to dane wrażliwe klientów. Brak zabezpieczeń = ryzyko prawne i reputacyjne.

**Odparcie:** Gotowe narzędzia są po angielsku, drogie per user, i mają funkcje, których nikt tu nie użyje. Własne narzędzie z brutalnie przyciętym MVP ma szansę działać dokładnie tak jak ta firma pracuje. Ryzyko adopcji jest realne, ale szefowie JDK popierają i są gotowi egzekwować migrację ze Signala. Warunek konieczny spełniony.

---

## FAZA 2 — KONTEKST RYNKOWY I BIZNESOWY

### 2.1 Szacowanie Szansy Rynkowej

- **TAM:** ~80 000 małych firm budowlanych i instalacyjnych w Polsce. `[ZAŁOŻENIE]`
- **SAM:** ~8 000–12 000 firm elektrycznych/instalacyjnych z regularną pracą projektową. `[ZAŁOŻENIE]`
- **SOM:** Na tym etapie = 1 firma (JDK). Ścieżka do sprzedaży innym firmom to osobna inicjatywa.
- **Wpływ finansowy (12 miesięcy):** ~18 000 zł oszczędności rocznie przy ograniczeniu czasu poprawek o 2h/tydzień × 3 pracowników × 60 zł/h. `[ZAŁOŻENIE — wymaga pomiaru bazowego]`

### 2.2 Krajobraz Konkurencyjny

| Narzędzie | Mocna strona | Słabość dla tego case'u |
|---|---|---|
| Signal | Znany, zainstalowany, darmowy | Brak struktury projektowej, wszystko miesza się w jednym kanale |
| Buildertrend / PlanGrid | Kompletne narzędzie dla budowy | Po angielsku, 30–100 USD/user/miesiąc, przerost formy |
| Notion + WhatsApp | Elastyczny, tani | Wymaga dyscypliny, zły mobilny UX dla pracownika na rusztowaniu |
| MS Teams | Integracje, znany ekosystem | Za ciężki, nikt na budowie nie używa |

**Wyróżnik:** Jedyne narzędzie po polsku, skrojone pod małą firmę elektryczną, gdzie pytanie i odpowiedź są zawsze powiązane z konkretnym projektem — nie giną w historii czatu.

### 2.3 Dopasowanie Strategiczne

JDK App odpowiada na bezpośredni problem operacyjny firmy, który szefowie już zidentyfikowali. Napędza cel: zwiększenie przepustowości projektów bez proporcjonalnego zwiększania zatrudnienia. Koszt niedziałania: firma rośnie, kierownik staje się wąskim gardłem nie do przeskalowania.

### 2.4 Cele i Metryki Sukcesu

**Metryka Gwiazdy Północy:**
> Liczba pytań projektowych rozwiązanych w aplikacji bez rozmowy telefonicznej — mierzone tygodniowo.

Punkt bazowy: 0. Cel: 15 pytań/tydzień po 60 dniach od wdrożenia. `[ZAŁOŻENIE]`

**OKR — 2 kwartały po launchu:**

> **Cel:** JDK App staje się pierwszym miejscem, do którego pracownik sięga, kiedy ma wątpliwość na budowie.
> - KR1: ≥ 80% aktywnych użytkowników loguje się min. 3× w tygodniu → cel: 12/15 pracowników do Dnia 90. `[ZAŁOŻENIE]`
> - KR2: Średni czas odpowiedzi na pytanie ≤ 15 minut w godzinach pracy. `[ZAŁOŻENIE]`
> - KR3: Subiektywna ocena „wiem co mam robić dziś" ≥ 4/5 w miesięcznej ankiecie. `[ZAŁOŻENIE]`

**Metryki ochronne:**
- Liczba błędów przy odbiorze NIE może wzrosnąć vs. baseline.
- Czas odpowiedzi kierownika na Signal NIE może spaść.

**Metryki próżności do zignorowania:** liczba pobrań, liczba wysłanych wiadomości.

### 2.5 Persony Użytkowników

**Persona 1 — Marek, elektryk na budowie**
- **Praca do wykonania:** „Kiedy mam wątpliwość co do schematu, chcę dostać odpowiedź natychmiast, żeby skończyć zadanie bez czekania."
- **3 frustracje:** Szuka projektu w historii Signala. Kierownik niedostępny w kluczowym momencie. Nie wie czy to co robi jest zgodne z poprzednim zespołem.
- **Sukces:** Otwiera telefon, wybiera projekt, zadaje pytanie — wszystko w 60 sekund.
- **Wpływ na adopcję:** Użytkownik końcowy
- **Cytat:** *„Jak nie wiem, to dzwonię. Ale jak szef nie odbiera, to robię jak myślę — i potem jest problem."*
- **Dostępność:** Praca w rękawicach — przyciski muszą być duże (min. 44×44px).

**Persona 2 — Kierownik (admin)**
- **Praca do wykonania:** „Kiedy jestem na spotkaniu, chcę żeby pracownicy mogli się odblokować sami."
- **3 frustracje:** Signal miesza służbowe z prywatnymi. Odpowiada na to samo pytanie 5 razy. Nie wie kto jest zablokowany i od jak dawna.
- **Sukces:** Dostaje powiadomienie, odpowiada jednym zdaniem, wszyscy widzą odpowiedź.
- **Wpływ na adopcję:** Decydent + Ambasador
- **Cytat:** *„Wolę odpowiedzieć raz na piśmie niż pięć razy przez telefon."*

---

## FAZA 3 — ZAKRES I EKSPERYMENTY

### 3.1 Plan Spike'ów

**Spike 1 — Walidacja nawyku (3–5 dni)**
Dedykowany kanał Signal „[Z4] Pytania techniczne". Kierownik odpowiada tylko tam.
- Wynik pozytywny: ≥ 5 pytań projektowych w tygodniu bez przypomnień.
- Wynik negatywny: powrót do diagnozy — problem głębszy niż narzędzie.

**Spike 2 — Walidacja bazy wiedzy (5 dni)**
Folder Google Drive / Notion z dokumentami Z4. Link wysłany pracownikom.
- Wynik pozytywny: ≥ 3 osoby wchodzą bez przypomnienia → baza wiedzy warta budowania.
- Wynik negatywny: nikt nie wchodzi → baza wiedzy zbędna w MVP.

**Spike 3 — Walidacja techniczna** ✅ ZALICZONY
Repo na GitHub istnieje, stack wybrany, aplikacja w budowie.

### 3.2 Zakres MVP

**W zakresie:**
1. Pracownik loguje się i widzi listę swoich projektów.
2. W projekcie zadaje pytanie tekstowe + opcjonalne zdjęcie z telefonu.
3. Kierownik dostaje powiadomienie email i odpowiada — odpowiedź widoczna dla wszystkich w projekcie.
4. Pytania i odpowiedzi archiwizowane i przeszukiwalne per projekt.
5. Admin dodaje/usuwa użytkowników, tworzy projekty, przypisuje ludzi.

**Cięcia zakresu — NIE w MVP:**
1. **Ranking i gamifikacja** — niepotrzebne do walidacji hipotezy; ryzyko społeczne bez podstawy.
2. **Upload dokumentów / baza wiedzy** — Spike 2 musi najpierw pokazać, czy pracownicy w ogóle sięgają po dokumenty self-service.
3. **Raportowanie postępu i zadania** — osobna hipoteza, osobny MVP.
4. **Obsługa podwykonawców** — najpierw walidacja z 15 stałymi pracownikami.
5. **Natywna aplikacja iOS/Android** — PWA wystarczy do walidacji; natywna to 2–3× więcej pracy.

### 3.3 Priorytety MoSCoW

| Funkcja | MoSCoW | Złożoność | Uzasadnienie |
|---|---|---|---|
| Logowanie / autoryzacja | Must | M | Bez tego brak kontroli dostępu |
| Lista projektów per użytkownik | Must | S | Rdzeń hipotezy |
| Zadawanie pytania ze zdjęciem | Must | M | Zdjęcie = 80% kontekstu pytania na budowie |
| Odpowiedź widoczna dla całego projektu | Must | S | Eliminacja powtarzania tej samej odpowiedzi |
| Powiadomienie email do admina | Must | S | Bez powiadomienia czas odpowiedzi > 15 min |
| Panel admina (użytkownicy, projekty) | Must | S | Bez tego brak wdrożenia |
| Archiwum pytań i wyszukiwarka | Should | M | Wartość rośnie z czasem |
| Powiadomienie push | Should | M | Wygodniejsze niż email, ale email wystarczy na start |
| Upload dokumentów projektowych | Could | L | Po walidacji Spike 2 |
| Ranking / gamifikacja | Won't | XL | Osobna inicjatywa po walidacji MVP |
| Natywna aplikacja mobilna | Won't | XL | Po walidacji hipotezy |

### 3.4 Dziennik Decyzji

| Decyzja | Alternatywy | Dlaczego ten wybór | Data | Status |
|---|---|---|---|---|
| PWA zamiast natywnej aplikacji | React Native, Flutter | Solo dev nie utrzyma 3 codebases | 2026-04-14 | `[ZAŁOŻENIE]` |
| MVP = Q&A, nie baza wiedzy | Baza wiedzy jako priorytet | Spike 2 musi najpierw pokazać potrzebę | 2026-04-14 | `[ZAŁOŻENIE]` |
| Podwykonawcy poza MVP | Włączenie od razu | Walidacja z 15 stałymi pracownikami przed otwarciem zewnętrznym | 2026-04-14 | `[ZAŁOŻENIE]` |
| Ranking odłożony | Ranking w MVP | Bez działającej komunikacji ranking nie ma na czym działać | 2026-04-14 | `[ZAŁOŻENIE]` |

---

## FAZA 4 — WYMAGANIA

### 4.1 Historyjki Użytkownika

---

**[US-AUTH-01] Logowanie do aplikacji**
**Jako** Marek (pracownik budowy),
**chcę** zalogować się emailem i hasłem,
**żeby** mieć pewność, że widzę tylko projekty mojej firmy.

**Kryteria Akceptacji:**
- Mając poprawny email i hasło, Gdy klikam „Zaloguj", Wtedy trafiam na listę projektów w max 3s.
- Mając błędne hasło, Gdy klikam „Zaloguj", Wtedy widzę „Nieprawidłowy email lub hasło" bez informacji które pole jest błędne.
- Mając sesję starszą niż 30 dni, Gdy otwieram aplikację, Wtedy jestem proszony o ponowne logowanie.

**Definicja Ukończenia:**
- [ ] Wszystkie kryteria akceptacji przechodzą w testach automatycznych
- [ ] Zweryfikowane na Chrome mobile i desktop
- [ ] Hasła hashowane (bcrypt/argon2), nigdy plain text
- [ ] Czas logowania ≤ 3s na 4G

---

**[US-AUTH-02] Pierwsze logowanie po dodaniu przez admina**
**Jako** Marek (nowy pracownik),
**chcę** dostać link aktywacyjny na email i ustawić własne hasło,
**żeby** nie musieć prosić admina o hasło tymczasowe.

**Kryteria Akceptacji:**
- Mając konto założone przez admina, Gdy otwieram link aktywacyjny, Wtedy widzę formularz ustawienia hasła (min. 8 znaków).
- Mając link starszy niż 72h, Gdy próbuję go użyć, Wtedy widzę „Link wygasł — poproś admina o nowy".
- Mając ustawione hasło, Gdy klikam „Aktywuj", Wtedy jestem automatycznie zalogowany i trafiam na listę projektów.

**Definicja Ukończenia:**
- [ ] Link jednorazowy — po użyciu nieważny
- [ ] Email dostarcza się w max 2 minuty
- [ ] Formularz ładuje się ≤ 2s

---

**[US-PROJ-01] Przeglądanie listy projektów**
**Jako** Marek,
**chcę** widzieć listę projektów, do których jestem przypisany,
**żeby** od razu wiedzieć gdzie wpisać pytanie.

**Kryteria Akceptacji:**
- Mając przypisanie do 2 projektów, Gdy loguję się, Wtedy widzę tylko te 2 projekty.
- Mając 0 projektów, Gdy loguję się, Wtedy widzę „Nie masz przypisanych projektów — skontaktuj się z kierownikiem".
- Mając otwarty projekt Z4, Gdy klikam jego nazwę, Wtedy trafiam na listę pytań w max 2s.

**Definicja Ukończenia:**
- [ ] Zweryfikowane na ekranie 360px (tani telefon Android)
- [ ] Czas ładowania ≤ 2s

---

**[US-QA-01] Zadanie pytania w projekcie**
**Jako** Marek,
**chcę** napisać pytanie i opcjonalnie dołączyć zdjęcie z telefonu,
**żeby** kierownik miał pełen kontekst bez telefonowania.

**Kryteria Akceptacji:**
- Mając otwarty projekt, Gdy piszę pytanie (min. 10 znaków) i klikam „Wyślij", Wtedy pytanie pojawia się z moim imieniem, datą i statusem „Oczekuje".
- Mając zdjęcie (max 10 MB, JPG/PNG/HEIC), Gdy wysyłam, Wtedy zdjęcie widoczne jako miniatura klikalną do pełnego rozmiaru.
- Mając słabą sieć, Gdy wysyłam pytanie, Wtedy widzę spinner i aplikacja nie traci wpisanej treści przy timeoucie.

**Definicja Ukończenia:**
- [ ] Zdjęcia kompresowane po stronie klienta (max 2 MB po kompresji)
- [ ] Pole tekstowe działa z klawiaturą ekranową na iOS i Android
- [ ] Wysłanie bez zdjęcia ≤ 1s, ze zdjęciem ≤ 5s na 4G

---

**[US-QA-02] Odpowiedź na pytanie**
**Jako** kierownik (admin),
**chcę** odpowiedzieć na pytanie pracownika,
**żeby** wszyscy w projekcie widzieli odpowiedź — nie tylko pytający.

**Kryteria Akceptacji:**
- Mając pytanie „Oczekuje", Gdy piszę odpowiedź i klikam „Odpowiedz", Wtedy status zmienia się na „Odpowiedziano" i odpowiedź widoczna dla wszystkich.
- Mając udzieloną odpowiedź, Gdy pracownik otwiera pytanie, Wtedy widzi odpowiedź bezpośrednio pod pytaniem.
- Mając udzieloną odpowiedź, Gdy pytający otwiera aplikację, Wtedy dostaje powiadomienie email z treścią i linkiem.

**Definicja Ukończenia:**
- [ ] Email dostarcza się w max 5 minut
- [ ] Odpowiedź pojawia się u pytającego ≤ 3s po wysłaniu przez admina

---

**[US-QA-03] Przeglądanie archiwum pytań**
**Jako** Marek,
**chcę** przejrzeć poprzednie pytania i odpowiedzi,
**żeby** nie zadawać pytania, które ktoś już zadał.

**Kryteria Akceptacji:**
- Mając 20 pytań, Gdy otwieram listę, Wtedy widzę pytania od najnowszego, 20 na stronie z paginacją.
- Mając słowo w wyszukiwarce, Gdy szukam, Wtedy widzę pytania zawierające je w treści lub odpowiedzi.
- Mając pytanie „Odpowiedziano", Gdy je otwieram, Wtedy widzę treść, zdjęcie, odpowiedź i datę.

**Definicja Ukończenia:**
- [ ] Wyszukiwanie działa na min. 100 pytaniach bez degradacji
- [ ] Wyniki wyszukiwania ≤ 2s

---

**[US-ADMIN-01] Zarządzanie użytkownikami**
**Jako** kierownik (admin),
**chcę** dodawać i usuwać użytkowników oraz przypisywać ich do projektów,
**żeby** kontrolować kto widzi jakie dane.

**Kryteria Akceptacji:**
- Mając formularz dodania, Gdy wpisuję imię, nazwisko, email i klikam „Dodaj", Wtedy użytkownik dostaje email aktywacyjny i pojawia się z statusem „Oczekuje na aktywację".
- Mając aktywnego użytkownika, Gdy klikam „Usuń dostęp", Wtedy traci dostęp natychmiast.
- Mając użytkownika, Gdy przypisuję go do Z4, Wtedy widzi Z4 po odświeżeniu.

**Definicja Ukończenia:**
- [ ] Usunięcie użytkownika nie usuwa jego historycznych pytań
- [ ] Panel admina dostępny tylko dla roli „admin"

---

**[US-ADMIN-02] Tworzenie projektu**
**Jako** kierownik (admin),
**chcę** utworzyć projekt z nazwą i opisem,
**żeby** pytania były organizowane per budowa.

**Kryteria Akceptacji:**
- Mając formularz, Gdy wpisuję nazwę (min. 3 znaki) i klikam „Utwórz", Wtedy projekt pojawia się na liście i mogę przypisywać użytkowników.
- Mając projekt bez użytkowników, Gdy pracownik się loguje, Wtedy nie widzi tego projektu.
- Mając projekt z pytaniami, Gdy próbuję usunąć, Wtedy muszę wpisać nazwę projektu żeby potwierdzić.

**Definicja Ukończenia:**
- [ ] Usunięcie wymaga double-confirmation
- [ ] Lista projektów ładuje się ≤ 2s przy 20 projektach

---

### 4.2 Przypadki Brzegowe i Tryby Awarii

**Funkcja: Upload zdjęcia**
- **Tryb awarii:** Połączenie zrywa się w trakcie uploadu
- **Oczekiwane zachowanie:** Po 30s timeout → komunikat „Nie udało się wysłać. Treść pytania zachowana." `[OTWARTE PYTANIE: cache zdjęć lokalnie? / Dev / przed buildem funkcji upload]`

- **Tryb awarii:** Plik 25 MB lub PDF
- **Oczekiwane zachowanie:** Walidacja po stronie klienta → „Zdjęcie jest za duże (max 10 MB)" lub „Dozwolone formaty: JPG, PNG"

**Funkcja: Logowanie**
- **Tryb awarii:** Użytkownik zapomniał hasła
- **Oczekiwane zachowanie:** Link resetujący (ważny 1h). Komunikat „Jeśli konto istnieje, wyślemy email" — nie ujawniamy czy email jest zarejestrowany.

- **Tryb awarii:** Admin usuwa konto użytkownika z aktywną sesją
- **Oczekiwane zachowanie:** Przy następnym zapytaniu → 401 → automatyczne wylogowanie → „Twoja sesja wygasła."

**Funkcja: Odpowiedź**
- **Tryb awarii:** Dwie osoby odpowiadają jednocześnie
- **Oczekiwane zachowanie:** Obie odpowiedzi widoczne chronologicznie. `[OTWARTE PYTANIE: limit jednej odpowiedzi? / PM / przed buildem US-QA-02]`

---

### 4.3 Wymagania Niefunkcjonalne

**Wydajność:**
- Lista pytań: ≤ 2s przy 200 pytaniach na 4G
- Upload zdjęcia: ≤ 5s dla 10 MB na 4G
- API response: ≤ 500ms (p95) przy 50 jednoczesnych użytkownikach

**Skalowalność:**
- MVP: max 50 użytkowników, 10 projektów, 1000 pytań/miesiąc
- Architektura musi obsłużyć 5× bez przepisywania
- Storage: ~1 GB/miesiąc (500 zdjęć × 2 MB) — cloud storage od początku `[ZAŁOŻENIE]`

**Bezpieczeństwo i Prywatność:**
- Dane projektowe poufne — HTTPS/TLS 1.3 obowiązkowe
- Dane pracowników podlegają RODO — polityka prywatności + możliwość usunięcia konta
- Hasła: bcrypt/argon2, nigdy plain text, nigdy w logach
- Zdjęcia w storage: dostęp tylko przez signed URL z wygaśnięciem

**Niezawodność:**
- Dostępność: 95% uptime/miesiąc (~36h dopuszczalnego downtime)
- Migracje bazy danych muszą być reversible

**Internacjonalizacja:**
- Język: polski (jedyny)
- Format dat: DD.MM.RRRR GG:MM

**Obserwowalność:**
- Każdy błąd 5xx logowany z: timestamp, user_id (zanonimizowany), endpoint, stack trace
- Alert gdy error rate > 5% przez 5 minut

---

### 4.4 Wymagania Dostępności

**[AX-01] Nawigacja klawiaturą** — WCAG 2.2 AA 2.1.1
Wszystkie elementy interaktywne osiągalne przez Tab. Test: przejdź cały przepływ tylko klawiaturą.

**[AX-02] Kontrast kolorów** — WCAG 2.2 AA 1.4.3 (min. 4.5:1 tekst, 3:1 UI)
Szczególnie statusy: „Odpowiedziano" (zielony), „Oczekuje" (szary). Test: axe-core / Lighthouse.

**[AX-03] Skalowanie tekstu** — WCAG 2.2 AA 1.4.4
Używaj em/rem zamiast px. Test: Ctrl+Plus do 200% — żaden tekst nie wychodzi poza kontener.

**[AX-04] Rozmiar celu dotykowego** — WCAG 2.2 AA 2.5.8 (min. 44×44px)
Przyciski akcji min. 44×44px. Elementy listy min. 48px wysokości. Test: ręczny na telefonie 5".
*Uwaga: najczęściej pomijane pod presją czasu.*

**[AX-05] Reduced Motion** — WCAG 2.2 AA 2.3.3
Wszystkie animacje opakowane w `@media (prefers-reduced-motion: reduce)`. Test: włącz opcję systemową.

---

## FAZA 5 — WYKONANIE I LAUNCH

### 5.1 Kryteria Zabicia

1. Po 6 tygodniach od wdrożenia mniej niż 5 pracowników zadało pytanie w aplikacji.
2. Czas odpowiedzi kierownika regularnie przekracza 2h — aplikacja nie rozwiązuje problemu, tylko przenosi go z Signala.
3. Po 90 dniach pracownicy używają Signala do pytań projektowych równolegle z aplikacją.

### 5.2 Kamienie Milowe

| Milestone | Data | Weryfikowalny wynik |
|---|---|---|
| Dzień 30 | 14 maja 2026 | Aplikacja na produkcji, wszyscy pracownicy Z4 mają konta, pierwsze pytanie zadane i odpowiedziane bez Signala |
| Dzień 60 | 13 czerwca 2026 | ≥ 10/15 pracowników loguje się min. 1×/tydzień, ≥ 30 pytań w archiwum |
| Dzień 90 | 13 lipca 2026 | Liczba błędów wykonawczych mierzalnie niższa niż na poprzednim porównywalnym projekcie |

### 5.3 Zależności i Ryzyka

**Kluczowe zależności:**

| Zależność | Właściciel | Ryzyko przy opóźnieniu |
|---|---|---|
| Komunikat szefów „Signal prywatny, pytania projektowe w JDK App" | Szefowie JDK | Adopcja = 0 |
| Cloud storage skonfigurowany przed deployem | Dev | Upload zdjęć nie działa |
| Wszyscy pracownicy mają smartfon z Chrome/Safari | Firma | PWA niedostępne |

**Rejestr Ryzyk:**

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|---|---|---|---|
| Pracownicy ignorują aplikację, zostają na Signalu | Wysoki | Wysoki | Szefowie przestają odpowiadać na pytania projektowe przez Signal od Dnia 1 |
| Solo dev nie wyrabia się z bugami po wdrożeniu | Wysoki | Średni | Wdróż tylko US-AUTH + US-PROJ + US-QA-01/02 na start |
| Zdjęcia HEIC nie działają na iOS | Średni | Średni | Konwersja HEIC→JPG po stronie klienta lub odrzucenie z komunikatem |
| Pracownicy blokują onboarding przez zapomniane hasła | Średni | Wysoki | Pierwsze logowanie jako sesja live (15 min) |
| Wyciek danych przez niechroniony endpoint | Niski | Wysoki | Audyt API przed Dniem 30 — wszystkie endpointy wymagają tokenu |

### 5.4 Strategia Wdrożenia

**Faza 1 — Zamknięta Beta (do ~12 maja)**
Ty + jeden chętny pracownik. Cel: sprawdzić czy przepływ logowanie → projekt → pytanie → odpowiedź działa bez Twojej pomocy technicznej. Próg wyjścia: 3 pytania zadane bez interwencji z Twojej strony.

**Faza 2 — Pełny zespół (maj–czerwiec)**
Wszyscy stali pracownicy Z4 dostają zaproszenia. Równocześnie szefowie wysyłają komunikat firmowy. Monitoring: codziennie przez pierwsze 2 tygodnie. Trigger wycofania: 0 logowań po 7 dniach → wróć do Spike 1.

**Faza 3 — Rutyna (od Dnia 60)**
Gotowość = ≥ 8 aktywnych użytkowników, ≤ 1 krytyczny bug/tydzień. Pierwsza retrospektywa z pracownikami po 60 dniach. Przegląd co 4 tygodnie.

### 5.5 Wyjście na Rynek

- **Koszt:** Narzędzie wewnętrzne. Hosting ~20–50 zł/miesiąc. `[ZAŁOŻENIE]`
- **Przygotowanie:** Instrukcja (1 strona A4 lub wideo 2 min) przed Dniem 30. Szefowie muszą znać aplikację przed pracownikami.
- **Launch:** Wewnętrzny komunikat od szefów — ważniejszy niż jakikolwiek marketing.
- **Przegląd po launchu:** 13 czerwca 2026. Właściciel decyzji: Ty + szefowie JDK.

---

## FAZA 6 — WALIDACJA I ZAMKNIĘCIE

### 6.1 Kryteria Sukcesu — Perspektywa Użytkownika

| Jak sukces odczuwa użytkownik | Mierzalny proxy | Punkt bazowy | Cel | Metoda |
|---|---|---|---|---|
| Wiem gdzie szukać odpowiedzi | % zduplikowanych pytań znalezionych w archiwum przed ponownym zadaniem | 0% | 20% po 90 dniach | Analiza treści pytań |
| Nie czekam godzinami | Mediana czasu pytanie → odpowiedź (godz. robocze) | Nieznany | ≤ 30 min | Log timestamps |
| Robię mniej błędów | Liczba usterek przy odbiorze vs. poprzedni projekt | Baseline z Z3 | Spadek o 30% | Rejestr kierownika |
| Nie szukam projektu na Signalu | % pytań w aplikacji vs. Signal | 0% | ≥ 80% po 60 dniach | Obserwacja |
| Aplikacja działa na moim telefonie | Zgłoszenia techniczne/miesiąc | — | ≤ 2 po Dniu 30 | Rejestr manualny |

### 6.2 Poza Zakresem

| Co | Dlaczego |
|---|---|
| Ranking i gamifikacja | Osobna hipoteza — wymaga działającej bazy komunikacyjnej |
| Podwykonawcy | Dodaje warstwę uprawnień; walidacja najpierw z 15 stałymi |
| Natywna iOS/Android | PWA wystarczy do walidacji |
| Upload dokumentów / baza wiedzy | Zależy od wyniku Spike 2 |
| Zadania i raportowanie | Problem B z Fazy 0 — osobna inicjatywa |
| Multi-tenant (inne firmy) | Osobny PRD i model biznesowy |

### 6.3 Otwarte Pytania

| # | Pytanie | Właściciel | Termin | Decyzja zastępcza |
|---|---|---|---|---|
| 1 | Czy aplikacja ma nazwę własną (nie „JDK App")? | Ty + szefowie | Przed Dniem 30 | „JDK App" jako nazwa robocza |
| 2 | Czy pytający może oznaczyć pytanie jako „rozwiązane", czy tylko admin? | Ty (PM) | Przed buildem US-QA-02 | Tylko admin zmienia status |
| 3 | Jaki jest baseline błędów wykonawczych z Z3? | Ty (dane historyczne) | Przed Dniem 30 | Sukces mierzony tylko aktywnością |
| 4 | Czy podwykonawcy kiedykolwiek dostaną dostęp i czy ich dane mają być oddzielone? | Szefowie JDK | Przed Fazą 2 | Podwykonawcy poza zakresem |
| 5 | Limit jednej odpowiedzi per pytanie, czy wiele aktualizacji? | Ty (PM) | Przed buildem US-QA-02 | Wiele odpowiedzi, chronologicznie |
| 6 | Czy pracownicy biurowi mają inny widok niż pracownicy budowy? | Ty (PM) | Przed buildem panelu | Jeden widok dla wszystkich nieadminów |
| 7 | Hosting: VPS, Vercel, Railway? Wpływa na SLA i koszt. | Ty (dev) | Przed deployem Fazy 1 | Najtańsze z automatycznym deployem z GitHub |
