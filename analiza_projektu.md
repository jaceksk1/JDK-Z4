# Analiza projektu: Zaspa IV Gdańsk — nr 6295

**Inwestor:** Spravia  
**Platforma:** Daluxa  
**Data analizy:** 2026-04-14  
**Katalog główny:** `03 PW/`, `04 Projekty Warsztatowe/`, `05 Nadzory Autorskie/`, `08 Karty Katalogowe/`, `09 Zmiany lokatorskie/`

---

## 1. Lista wszystkich plików z opisem zawartości

### Typy plików w projekcie

| Rozszerzenie     | Liczba    | Opis                                       |
| ---------------- | --------- | ------------------------------------------ |
| `.pdf`           | **3 452** | Rysunki techniczne, opisy, schematy        |
| `.dwg`           | **3 219** | Rysunki CAD (GstarCAD / AutoCAD)           |
| `.jpg`           | 30        | Wizualizacje, textury, zdjęcia materiałów  |
| `.zip`           | 26        | Paczki DWG z xref (transmittals)           |
| `.docx` / `.doc` | 16        | Opisy techniczne branżowe                  |
| `.xlsx`          | 8         | Zestawienia, karty materiałów              |
| `.rvt`           | 6         | Modele Revit (źródłowe BIM)                |
| `.ifc`           | 6         | Modele BIM (eksport IFC)                   |
| `.py`            | 1         | Skrypt ElectroMap — ekstraktor TM+TT z DWG |
| `.txt`           | 1         | Transmittal Report (lista xref do DWG)     |
| `.odt`           | 1         | Opis WNT (LibreOffice)                     |
| `.rar`           | 1         | Archiwum wizualizacji marketingowych       |
| `.ctb`           | 1         | Tabela stylów wydruku AutoCAD              |

### Struktura folderów głównych

```
Projekt z Daluxa/
├── 03 PW/                     Projekt Wykonawczy (11 branż)
│   ├── 00 BIM/                Modele BIM (IFC + RVT)
│   ├── 01 ARC/                Architektura
│   ├── 02 KON/                Konstrukcja
│   ├── 03 SAN/                Sanitarna
│   ├── 04 ELE/                Elektryczna
│   ├── 05 TEL/                Teletechniczna
│   ├── 06 SIE/                Sieci zewnętrzne
│   ├── 07 DRO/                Drogowa
│   ├── 08 MEC/                Mechaniczna (PUSTA)
│   ├── 09 ZIE/                Zieleń
│   ├── 10 WNT/                Wnętrza
│   └── 11 XXX/                Rezerwa (PUSTA)
├── 04 Projekty Warsztatowe/   Projekty warsztatowe KON, SAN, ELE+TT
├── 05 Nadzory Autorskie/      (PUSTY)
├── 06 Zatwierdzone KZM/       Karty zamian materiałowych (PUSTE)
├── 08 Karty Katalogowe/       Karty mieszkań, LU, garaży, MP, KL, PZT
├── 09 Zmiany lokatorskie/     Dokumentacja zmian lokatorskich
└── 11 Wizualizacje/           Wizualizacje marketingowe (JPG + RAR)
```

### Projekt Wykonawczy (03 PW) — liczba plików per branża

| Branża         | Folder   | PDF       | DWG       | Opisy                    |
| -------------- | -------- | --------- | --------- | ------------------------ |
| Architektura   | `01 ARC` | 85        | 85        | 2× DOCX, 2× XLSX         |
| Konstrukcja    | `02 KON` | **928**   | **913**   | 1× DOCX, 2× XLSX         |
| Sanitarna      | `03 SAN` | 94        | 93        | 2× DOCX, 2× DOC, 1× XLSX |
| Elektryczna    | `04 ELE` | 294       | 201       | 4× DOC, 1× XLSX, 1× PY   |
| Teletechniczna | `05 TEL` | 27        | 27        | 1× XLSX                  |
| Sieci zewn.    | `06 SIE` | 8         | 0         | —                        |
| Drogowa        | `07 DRO` | 9         | 3         | 1× DOCX                  |
| Mechaniczna    | `08 MEC` | 0         | 0         | —                        |
| Zieleń         | `09 ZIE` | 8         | 0         | 1× DOCX                  |
| Wnętrza        | `10 WNT` | 111       | 2         | 4× DOCX, 1× ODT          |
| Rezerwa        | `11 XXX` | 0         | 0         | —                        |
| **ŁĄCZNIE**    |          | **1 564** | **1 324** |                          |

> Uwaga: podane liczby dotyczą tylko folderów `02 PDF` i `03 DWG`. Całkowita liczba PDF w projekcie to 3 452 (uwzględnia karty katalogowe i projekty warsztatowe).

### Opisy techniczne (01 OPIS) — pliki

| Plik                                        | Branża  | Typ      | Opis                                   |
| ------------------------------------------- | ------- | -------- | -------------------------------------- |
| `6295_01_PW_ARC_XXX_AB0_X_OPI_XXX_00_00`    | ARC     | DOCX+PDF | Opis architektoniczny                  |
| `6295_01_PW_ARC_XXX_AB0_X_OPI_XXX_01_00/01` | ARC     | XLSX     | Zestawienie (2 rewizje)                |
| `6295_01_PW_ARC_XXX_AB0_X_OPI_XXX_02_00`    | ARC     | DOCX+PDF | Opis uzupełniający                     |
| `6295_01_PW_KON_XXX_AB0_X_OPI_XXX_00_05`    | KON     | DOCX     | Opis konstrukcji (rew. 05)             |
| `6295_01_PW_KON_XXX_AB0_X_OPI_XXX_01_04`    | KON     | XLSX     | Zestawienie KON (rew. 04)              |
| `6295_01_PW_KON_XXX_AB0_X_OPI_XXX_03_00`    | KON     | XLSX     | Dodatkowe zestawienie KON              |
| `6295_01_PW_SAN_XXX_AB0_X_OPI_XXX_00_00/02` | SAN     | DOCX     | Opis sanitarny (2 rewizje)             |
| `6295_01_PW_SAN_WEN_AB0_X_OPI_XXX_00_00/03` | SAN/WEN | DOC      | Opis wentylacji (2 rewizje)            |
| `6295_01_PW_SAN_XXX_AB0_X_ZES_XXX_00_00`    | SAN     | XLSX     | Zestawienie SAN                        |
| `6295_01_PW_ELE_XXX_XXX_X_OPI_XXX_01_00…02` | ELE     | DOC      | Opisy elektryczne (4 rewizje)          |
| `6295_01_PW_ELE_XXX_XXX_X_ZES_XXX_00_00`    | ELE     | XLSX     | Zestawienie ELE                        |
| `6295_01_PW_TEL_XXX_XXX_X_ZES_XXX_00_00`    | TEL     | XLSX     | Zestawienie TEL                        |
| `6295_01_PW_DRO_GEN_AB0_X_OPI_XXX_01_00`    | DRO     | DOCX     | Opis drogowy                           |
| `6295_01_PW_ZIE_GEN_A00_X_OPI_XXX_XX_XX`    | ZIE     | DOCX     | Opis zieleni                           |
| `6295_01_PW_WNT_XXX_AB0_X_OPI_XXX_01…06`    | WNT     | DOCX+ODT | Opisy wnętrz (4 wersje)                |
| `extract_tmtt.py`                           | ELE     | PY       | **Skrypt ElectroMap** — patrz sekcja 2 |

### Modele BIM (`00 BIM/`)

| Plik                                                  | Format  | Zawartość                         |
| ----------------------------------------------------- | ------- | --------------------------------- |
| `6295_01_PW_ARC_GEN_A00_X_XXX_XXX_01_00.ifc`          | IFC     | Architektura — budynek A          |
| `6295_01_PW_ARC_GEN_AB0_X_XXX_XXX_01_00.ifc`          | IFC     | Architektura — budynki A+B        |
| `6295_01_PW_ARC_GEN_B00_X_XXX_XXX_01_00.ifc`          | IFC     | Architektura — budynek B          |
| `6295_01_PW_SAN_XXX_AB0_X_RZU_XXX_00_00.ifc`          | IFC     | Sanitarna — AB                    |
| `6295_01_PW_KON_XXX_AB0_X_RZU_XXX_00_02.rvt`          | RVT     | Konstrukcja — AB (rew. 02)        |
| `6295_01_PW_KON_XXX_AB0_X_RZU_XXX_00_03.rvt` + `.ifc` | RVT+IFC | Konstrukcja — AB (rew. 03)        |
| `ZASPA_IV_ELE_PW_27.ifc`                              | IFC     | Elektryczna — pełny model         |
| `IS_R23_ZASPA_A3_F,G_A_2025.02.07.rvt`                | RVT     | Instalacje (zewnętrzny dostawca)  |
| `ZASPA_A4_A,B_A_GARAŻ_MASTER_detached.rvt`            | RVT     | Architektura garażu A+B           |
| `ZASPA_A4_A_A_CENTRAL_detached.rvt`                   | RVT     | Architektura budynek A (centrala) |
| `ZASPA_A4_B_A_CENTRAL_detached.rvt`                   | RVT     | Architektura budynek B (centrala) |

> Folder `dalux/` jest pusty — przeznaczony na eksport do platformy Daluxa.

---

## 2. Typy obiektów elektrycznych (skrypt extract_tmtt.py)

Projekt zawiera skrypt `03 PW/04 ELE/03 DWG/extract_tmtt.py` — narzędzie **ElectroMap**, które wyciąga numery rozdzielnic i lokali z planów DWG. Skrypt nie był jeszcze uruchomiony (brak pliku wynikowego CSV/XLSX). Zdefiniowane wzorce rozpoznawania:

| Wzorzec                   | Przykład            | Typ obiektu            |
| ------------------------- | ------------------- | ---------------------- |
| `[AB][12].[1-6].[1-226]`  | `A1.2.5`, `B2.4.12` | Mieszkanie (TM+TT)     |
| `TM+TT [AB][12].[π].[nr]` | `TM+TT A1.3.7`      | Mieszkanie z prefiksem |
| `MP[nr]`                  | `MP100`, `MP-150`   | Miejsce parkingowe     |
| `KL.[nr]`                 | `KL.13`, `KL-184`   | Komórka lokatorska     |
| `[AB][12]-W[nr]`          | `A1-W1`, `B2-W2`    | Winda                  |
| `COD/RPO/SVS-[AB][12]`    | `COD-A1`, `RPO-B2`  | System ppoż            |

### Rozdzielnice elektryczne w PW ELE (rysunki PDF)

| Subkategoria | Liczba PDF | Opis                                            |
| ------------ | ---------- | ----------------------------------------------- |
| `ROZ / SCH`  | 126        | Schematy rozdzielnic (nr 01–76, z lukami 60–61) |
| `ROZ / WID`  | 101        | Widoki/zestawienia rozdzielnic (nr 01–101)      |
| `GND`        | 16         | Instalacja uziemienia                           |
| `OSW`        | 15         | Oświetlenie                                     |
| `OUZ`        | 17         | Ochrona przed przepięciami / uzupełnienia       |
| `PZT`        | 3          | Plan zagospodarowania terenu — ELE              |
| `TAB`        | 9          | Tablice/zestawienia                             |
| `TRK`        | 3          | Trasy kablowe                                   |
| `XXX`        | 4          | Ogólne/niesklasyfikowane                        |

> Archiwum ELE (`04 ELE/Archiwalne/`) zawiera **131 plików DWG** — starsze rewizje, zastąpione przez bieżące.

---

## 3. Struktura numeracji lokali (budynek/klatka/piętro/numer)

### System oznaczeń

**Budynki:** A i B  
**Klatki (sekcje):** A1, A2 (budynek A) | B1, B2 (budynek B)  
**Piętra:** G01 (garaż -1), P00 (parter), P01–P07 (piętra 1–7)  
**Numeracja lokali:** ciągła, globalna — od 1 do 226

### Schemat numeracji mieszkań

```
Format TM+TT:  [klatka].[piętro].[numer_lokalu]
Przykład:       A1.2.5  →  klatka A1, piętro 2, lokal nr 5

Numeracja globalna:
  Budynek A: lokale  1–126  (klatki A1 i A2)
  Budynek B: lokale 127–226 (klatki B1 i B2)
```

### Numeracja lokali użytkowych (LU)

```
Format: [klatka].U.[numer_LU]
  A1.U.1  – A1.U.7    → 7 lokali (klatka A1)
  A2.U.8  – A2.U.15   → 8 lokali (klatka A2)
  B1.U.16 – B1.U.22   → 7 lokali (klatka B1)
  B2.U.23 – B2.U.27   → 5 lokali (klatka B2)
  ŁĄCZNIE: 27 lokali użytkowych
```

### Numeracja garaży i komórek

```
Miejsca parkingowe (MP): nr 20–317  →  298 sztuk
Komórki lokatorskie (KL): KL 1–KL 184  →  184 sztuki
Garaż: 2 karty ogólne (G-1, K1)
```

---

## 4. Liczba lokali per typ

| Typ lokalu                | Zakres numerów   | Liczba   | Podstawa danych        |
| ------------------------- | ---------------- | -------- | ---------------------- |
| Mieszkania — budynek A    | 1–126            | **126**  | Karty Mieszkań A (PDF) |
| Mieszkania — budynek B    | 127–226          | **100**  | Karty Mieszkań B (PDF) |
| **Mieszkania łącznie**    | 1–226            | **226**  |                        |
| Lokale użytkowe (LU)      | A1.U.1 – B2.U.27 | **27**   | Karty LU (PDF)         |
| Miejsca parkingowe (MP)   | MP20–MP317       | **298**  | Karty MP (PDF)         |
| Komórki lokatorskie (KL)  | KL 1–KL 184      | **184**  | Karty KL (PDF)         |
| Kondygnacje (karty arch.) | —                | 228 kart | 126 A + 102 B          |

### Podział mieszkań na klatki (szacunkowy)

| Klatka | Budynek | Piętra  | Lokale |
| ------ | ------- | ------- | ------ |
| A1     | A       | P00–P07 | ~63    |
| A2     | A       | P00–P07 | ~63    |
| B1     | B       | P00–P07 | ~50    |
| B2     | B       | P00–P07 | ~50    |

> Precyzyjny podział na klatki wymaga uruchomienia skryptu `extract_tmtt.py` na plikach DWG z branży ELE.

---

## 5. Rozbieżności i anomalie w danych

### A. Zduplikowane foldery w Kartach Katalogowych

| Problem                                                    | Foldery                                                       | Status                     |
| ---------------------------------------------------------- | ------------------------------------------------------------- | -------------------------- |
| Dwa foldery „Miejsca Postojowe" z identyczną zawartością   | `6. KARTY MIEJSC POSTOJOWYCH` = `7. KARTY MIEJSC POSTOJOWYCH` | **Duplikat** — 298 PDF × 2 |
| Dwa foldery „Komórki Lokatorskie" z identyczną zawartością | `7. KOMÓRKI LOKATORSKIE` = `8. KOMÓRKI LOKATORSKIE`           | **Duplikat** — 184 PDF × 2 |
| Dwa foldery „Karty PZT" z identyczną zawartością           | `8. KARTY PZT` = `9. KARTY PZT`                               | **Duplikat** — 7 PDF × 2   |

> Prawdopodobna przyczyna: zmiana numeracji folderów podczas dodawania kategorii (KARTY GARAŻU i KARTY INSTALACYJNE LU), bez usunięcia starych kopii.

### B. Dodatkowe karty kondygnacji budynek B (nr 225.2 i 226.2)

W folderze `3. KARTY KONDYGNACJI/BUDYNEK B/PDF` są **102 pliki** zamiast oczekiwanych 100:

- `ZAS4_MM_KK_B_B_225.2.pdf` — karta uzupełniająca do lokalu 225
- `ZAS4_MM_KK_B_B_226.2.pdf` — karta uzupełniająca do lokalu 226

Karty Mieszkań i Karty Instalacyjne mają po 100 plików — brak odpowiadających kart `.2` → **niekompletność dokumentacji dla lokali 225 i 226**.

### C. Brakujące schematy rozdzielnic ELE (nr 60–61)

W schematach rozdzielnic (`ROZ/SCH`) seria numeracyjna 01–76 zawiera **lukę na pozycjach 60 i 61**:

```
...58, 59, [brak 60], [brak 61], 62, 63...
```

Oznacza to brak 2 schematów rozdzielnic — możliwe że nie zostały opracowane lub są w archiwum.

### D. Brak DWG dla branż SIE, ZIE, MEC

| Branża   | PDF | DWG | Uwaga                            |
| -------- | --- | --- | -------------------------------- |
| `06 SIE` | 8   | 0   | DWG w formacie ZIP (transmittal) |
| `07 DRO` | 9   | 3   | Część DWG tylko w ZIP            |
| `08 MEC` | 0   | 0   | Folder całkowicie pusty          |
| `09 ZIE` | 8   | 0   | DWG tylko jako ZIP               |
| `10 WNT` | 111 | 2   | DWG w 6 plikach ZIP (xref)       |

> Branże SIE, DRO, ZIE i WNT mają rysunki DWG zapakowane w **15 archiwach ZIP** (transmittal z eTransmit GstarCAD). Pliki nie zostały rozpakowane.

### E. Foldery puste lub niekompletne

| Folder                                    | Status                                           |
| ----------------------------------------- | ------------------------------------------------ |
| `03 PW/08 MEC/` — cała branża             | Całkowicie pusty                                 |
| `03 PW/11 XXX/` — rezerwa                 | Całkowicie pusty                                 |
| `05 Nadzory Autorskie/`                   | Pusty (foldery ARC, KON, SAN, ELE+TT bez plików) |
| `06 Zatwierdzone KZM/BUD`, `/ELE`, `/SAN` | Puste (3 foldery kategorii)                      |
| `10 Dodatkowe opracowania/`               | Pusty                                            |
| `00 BIM/dalux/`                           | Pusty (przeznaczony na eksport do Daluxa)        |
| `04 PW Warsztatowe/01 ARC/`               | Brak plików PDF (tylko foldery)                  |

### F. Archiwum ELE — 131 starych DWG

Folder `03 PW/04 ELE/Archiwalne/` zawiera **131 archiwalnych plików DWG** (rewizja `_01_00`). Bieżące DWG są w rewizji `_01_01` lub `_01_02`. Folder powinien być wyraźnie oznaczony jako nieaktualny.

### G. Archiwum KON — 12 starych PDF

Folder `03 PW/02 KON/02 PDF/archiwum/` zawiera **12 archiwalnych plików PDF**. Analogicznie do ELE — stare rewizje.

### H. Pliki zasobów w folderze DWG (WNT)

Folder `03 PW/10 WNT/03 DWG/` zawiera **20+ podfolderów z zasobami** (tekstury, zdjęcia mebli, katalogi płytek, rośliny, logo Spravia, poręcze Normbau) — są to xrefy do rysunków wnętrz. Nie są plikami projektu sensu stricto, ale są potrzebne do otwarcia DWG.

---

## 6. Relacje między plikami

### Hierarchia dokumentacji

```
BIM (IFC/RVT)                    ← modele źródłowe
    └── DWG (rysunki CAD)        ← opracowania branżowe
            └── PDF (wydruki)    ← dokumenty przekazywane
                    └── Karty Katalogowe  ← karty per lokal
```

### Konwencja nazewnictwa plików PW

```
6295 _ 01 _ PW _ ELE _ ROZ _ XXX _ X _ SCH _ XXX _ 01 _ 01 .pdf
 [1]  [2]  [3] [4]   [5]   [6]  [7] [8]   [9]  [10] [11]

[1]  Nr projektu: 6295
[2]  Nr tomu: 01 (jeden tom PW)
[3]  Faza: PW (Projekt Wykonawczy)
[4]  Branża: ARC/KON/SAN/ELE/TEL/DRO/ZIE/WNT
[5]  Subkategoria: ROZ, GND, OSW, SCI, GEN, OIC, WEN itp.
[6]  Budynek/sekcja: A00 (bud.A), B00 (bud.B), AB0 (oba), XXX (wspólne)
[7]  Podsekcja: 1, 2, X (brak)
[8]  Typ rysunku: RZU (rzut), SCH (schemat), WID (widok), DET (detal), PRZ (przekrój), ZES (zestawienie), OPI (opis)
[9]  Poziom: G01 (garaż), P00–P08 (kondygnacje), XXX (brak)
[10] Nr rysunku w serii
[11] Nr rewizji
```

### Relacje między zbiorami

| Zbiór A                                           | Relacja                  | Zbiór B                                                        |
| ------------------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| `03 PW/04 ELE/03 DWG/*.dwg`                       | generuje →               | `03 PW/04 ELE/02 PDF/*.pdf`                                    |
| `03 PW/00 BIM/*.rvt`                              | eksportuje →             | `03 PW/00 BIM/*.ifc`                                           |
| `03 PW/00 BIM/*.rvt`                              | jest źródłem dla →       | `03 PW/01 ARC/02 PDF/*.pdf`                                    |
| `08 Karty Katalogowe/1. KARTY MIESZKAŃ/*.dwg`     | generuje →               | `08 Karty Katalogowe/1. KARTY MIESZKAŃ/*.pdf`                  |
| `08 Karty Katalogowe/2. KARTY INSTALACYJNE/*.pdf` | odpowiada →              | `08 Karty Katalogowe/1. KARTY MIESZKAŃ/*.pdf` (te same numery) |
| `08 Karty Katalogowe/3. KARTY KONDYGNACJI/*.pdf`  | odpowiada →              | `08 Karty Katalogowe/1. KARTY MIESZKAŃ/*.pdf` + 2 karty `.2`   |
| `03 PW/04 ELE/03 DWG/extract_tmtt.py`             | przetwarza →             | `03 PW/04 ELE/03 DWG/*.dwg`                                    |
| `09 Zmiany lokatorskie/A.14/`                     | modyfikuje →             | lokal A.14 z `08 Karty Katalogowe/`                            |
| `04 Projekty Warsztatowe/02 KON/`                 | uszczegóławia →          | `03 PW/02 KON/`                                                |
| `06 Zatwierdzone KZM/`                            | zatwierdza materiały z → | `03 PW/` (wszystkie branże)                                    |

### Zmiany lokatorskie — powiązania

| Lokal | Folder                         | Zawartość        | Budynek |
| ----- | ------------------------------ | ---------------- | ------- |
| A.14  | `09 Zmiany lokatorskie/A.14/`  | ZIP + opinia PDF | A       |
| A.39  | `09 Zmiany lokatorskie/A.39/`  | ZIP + opinia PDF | A       |
| A.40  | `09 Zmiany lokatorskie/A.40/`  | ZIP + opinia PDF | A       |
| A.87  | `09 Zmiany lokatorskie/A.87/`  | ZIP + opinia PDF | A       |
| B.223 | `09 Zmiany lokatorskie/B.223/` | ZIP + opinia PDF | B       |

> Rejestr wszystkich zmian lokatorskich jest w pliku: `09 Zmiany lokatorskie/Załącznik nr 7 - zmiany lokatorskie.xlsx`

---

## Podsumowanie ilościowe

| Kategoria                             | Wartość              |
| ------------------------------------- | -------------------- |
| Łączna liczba plików (wszystkie typy) | ~7 000               |
| Rysunki PDF (projekt wykonawczy PW)   | 1 564                |
| Rysunki DWG (projekt wykonawczy PW)   | 1 324                |
| Karty katalogowe PDF                  | ~1 500               |
| Modele BIM (IFC + RVT)                | 12                   |
| Mieszkania ogółem                     | **226**              |
| Lokale użytkowe (LU)                  | **27**               |
| Miejsca parkingowe (MP)               | **298**              |
| Komórki lokatorskie (KL)              | **184**              |
| Zmiany lokatorskie (zatwierdzone)     | **5**                |
| Branże projektu                       | 11 (z czego 2 puste) |
