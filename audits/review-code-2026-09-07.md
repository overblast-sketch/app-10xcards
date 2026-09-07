# Review kodu drugim dostawcą: F-01, S-01, S-02 (2026-09-07)

- **Recenzent:** Codex CLI, model `gpt-5.5`, `model_reasoning_effort=high`,
  sandbox read-only (ADR-0003 floty: recenzent inny niż implementujący).
- **Zakres:** implementacja planów 0901, 0001, 0002 względem `prd.md`,
  `test-plan.md`, `AGENTS.md`; kod `src/**`, migracje, testy, CI.
- **Werdykt recenzenta:** MERGE PO POPRAWKACH P1.
- **Stanowisko sesji:** wszystkie trzy P1 zasadne, wdrożone tego samego dnia
  (tabela rozliczenia na końcu); P2 wdrożone.

## Raport recenzenta (bez zmian)

### 1. Scorecard

| Wymiar | Ocena | Uzasadnienie |
|---|---:|---|
| Poprawność względem PRD | 4/5 | Główne przepływy FR-001..FR-016 są zaimplementowane, ale RLS pozwala ominąć domenową bramkę zapisu fiszek mimo kontraktu „wyłącznie po decyzji człowieka" z PRD. |
| Bezpieczeństwo | 3/5 | Auth i ownership są obecne (`src/middleware.ts:24`, `supabase/migrations/20260907090000_initial_schema.sql:88`), ale bezpośrednie polityki `insert/update` na tabelach osłabiają boundary biznesowy. |
| Jakość testów | 3/5 | Testy dobrze mapują R1/R2/R3/R4/R5/R6/R7, lecz w CI wysokie ryzyka mogą zostać cicho pominięte przy braku sekretów Supabase. |
| Obsługa błędów i odporność | 4/5 | AI provider ma timeout, retry i walidację (`src/lib/ai/openrouter-provider.ts:61`, `:116`), a zapis decka idzie przez RPC, ale część błędów DB trafia do klienta jako surowe komunikaty. |
| Czytelność i struktura | 5/5 | Podział na middleware, API routes, services, provider adapter i czyste funkcje bramki jest spójny z planami i łatwy do prześledzenia. |
| Zgodność z planami i AGENTS.md | 4/5 | Zakres F-01/S-01/S-02 jest dowieziony, RLS i mock AI są zgodne z zasadami, ale review checkboxy w planach pozostają otwarte i CI nie wymusza pełnych testów Supabase. |

### 2. Findingi

**P1: Bezpośredni `insert` do `flashcards` omija bramkę akceptacji**
(`supabase/migrations/20260907090000_initial_schema.sql:90`). PRD mówi, że
fiszka powstaje wyłącznie z kandydata `accepted`/`edited` podczas zapisu
generacji (`prd.md:103-105`), a ręczne tworzenie jest poza zakresem
(`prd.md:141`). Polityka `flashcards_insert_own` dopuszcza dowolny insert
własnej fiszki; test IDOR utrwala ten bypass jako fixture
(`tests/integration/idor.test.ts:33-35`). Poprawka: usunąć politykę insertu,
zapis wyłącznie przez `save_generation` (security definer z jawnym
`auth.uid()` i minimalnym `search_path`), testy seedować przez bramkę.

**P1: Zbyt szerokie `update` na `generations` pozwala ręcznie zmienić
statystyki** (`...initial_schema.sql:35`). PRD wymaga, by statystyka była
liczona z decyzji i nieedytowalna (`prd.md:116-117`). Poprawka: ograniczyć
mutacje do kontrolowanych ścieżek albo trigger blokujący zmianę liczników
i `saved_at` poza RPC.

**P1: CI może przejść na zielono bez testów Supabase dla R1/R2/R3**
(`.github/workflows/ci.yml:22,38-42`). Testy pomijają się bez sekretów
(`save-generation.test.ts:8,16`, `idor.test.ts:8,25`,
`gated-generation.spec.ts:35`, `deck-edit-delete.spec.ts:42`), wbrew planowi
S-01 (`plan.md:97-98`). Poprawka: krok fail-fast `test -n "$SUPABASE_URL"`.

**P2: API ujawnia surowe komunikaty DB/RPC** (`generation.service.ts:47,78,105`
→ `api/generations/index.ts:27-28`). Poprawka: log po stronie serwera, stały
komunikat dla klienta.

### 3. Rozjazdy dokument vs kod

- PRD: fiszka tylko po decyzji człowieka (`prd.md:158-159`) vs polityka insertu (`...sql:90-91`).
- PRD: statystyka nieedytowalna (`prd.md:116-117`) vs ogólne `update` (`...sql:35-36`).
- Plan S-01: e2e w CI nie pomijane (`plan.md:97-98`) vs `skipIf` bez sekretów.

### 4. Werdykt

**MERGE PO POPRAWKACH P1**: główna aplikacja wygląda funkcjonalnie, ale przed
oddaniem trzeba domknąć boundary danych wokół bramki akceptacji i wymusić
w CI, że testy Supabase faktycznie się wykonały.

## Rozliczenie (sesja implementująca, 2026-09-07)

| Finding | Decyzja | Wdrożenie |
|---|---|---|
| P1 insert do `flashcards` | przyjęte | migracja `20260907120000_gate_hardening.sql`: polityka `flashcards_insert_own` usunięta, `save_generation` jako `security definer` z jawnym `auth.uid()` i `search_path = public`; `idor.test.ts` seeduje przez generację → kandydat → RPC i asercja, że bezpośredni insert pada nawet dla właściciela |
| P1 `update` na `generations` | przyjęte | trigger `generations_guard_update`: liczniki, `saved_at` i przejście na `saved` tylko z transakcyjnym znacznikiem `app.gate_bypass` ustawianym w RPC; aplikacja nadal oznacza `failed`; test „owner cannot forge generation statistics" |
| P1 CI bez sekretów | przyjęte | `ci.yml`: krok `test -n "$SUPABASE_URL" && test -n "$SUPABASE_KEY"` w obu jobach, sekrety przekazane też do `npm test` |
| P2 surowe komunikaty | przyjęte | `logDbError` po stronie serwera, stałe komunikaty po polsku dla klienta |
| Review checkboxy w planach otwarte | przyjęte | plany 0901/0001/0002: `Review (review.md, werdykt: MERGE PO POPRAWKACH P1, wdrożone)` z odsyłaczem tutaj |
