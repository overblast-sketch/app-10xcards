# Plan 0001 - gated-generation-loop

- **Pozycja roadmapy:** S-01 (numer katalogu z ID: `S-01` → `0001`)
- **Złożoność:** średnia
- **Akceptacja:** 2026-09-07, Tomasz ("rób S-01")
- **Status:** zakończony 2026-09-07 (review: do zrobienia, nie blokuje F-02)
- **Research:** nie był potrzebny, bo kontrakt bazy jest w planie 0901,
  a integracja OpenRouter to jedno wywołanie HTTP zgodne z API OpenAI
  (`POST /api/v1/chat/completions`, `response_format` JSON).

## End state

Zalogowany użytkownik na `/generate` wkleja tekst (1 000 - 10 000 znaków),
klika "Generuj", widzi kandydatów (przód/tył) w stanie "do decyzji", dla
każdego wybiera akceptuj / edytuj / odrzuć, klika "Zapisz do decka" i trafia
na `/deck`, gdzie widzi zapisane fiszki oraz podsumowanie generacji (ile
wygenerowano, zaakceptowano, po edycji, odrzucono). Tekst za krótki lub za
długi jest odrzucany przed wywołaniem AI. Błąd dostawcy AI pokazuje komunikat
i zostawia tekst w formularzu. Dostawca AI stoi za adapterem: `mock`
(deterministyczny, do testów) i `openrouter`. Test e2e pełnej pętli na mocku
(ryzyko R1) i testy unit bramki (R1, R7), walidacji (R4) i adaptera
OpenRouter (R5) są zielone lokalnie i w CI.

## Fazy

### Faza 1: adapter AI i czysta logika bramki
- **Intencja:** `AiProvider` z `MockProvider` i `OpenRouterProvider`
  (timeout 60 s, jedna próba ponowienia na 429/5xx/timeout, walidacja
  odpowiedzi zod, przycinanie do limitów 200/500), plus czyste funkcje
  bramki: `applyDecisions`, `selectCardsToSave`, `summarizeDecisions`.
  Testy unit: R1, R7 (wyrocznia US-005: 5 kandydatów → 3 fiszki, 5/2/1/1),
  R5 (nie-JSON, 429 potem 200, timeout, pusta lista).
- **Zakres (pliki/obszary):**
  ```globs
  src/lib/ai/**
  src/lib/services/gate.ts
  src/types.ts
  tests/unit/**
  package.json
  package-lock.json
  ```
- **Kontrakt:** `AiProvider.generateCandidates(text): Promise<CandidateDraft[]>`;
  błędy jako `AiProviderError { code: "timeout" | "http" | "invalid_response" | "empty" }`.
  Moduły w `src/lib/ai/` i `src/lib/services/` nie importują `astro:*`
  (testowalność bez Astro); konfigurację dostaje fabryka w `src/lib/ai/index.ts`.

### Faza 2: usługa generacji i API
- **Intencja:** `generation.service.ts` (utwórz generację `draft`, wywołaj
  dostawcę, zapisz kandydatów `pending`; przy błędzie status `failed`
  z `error_message`; zapis przez RPC `save_generation`), trasy
  `POST /api/generations` i `POST /api/generations/[id]/save` z walidacją
  zod, klient Supabase typowany `Database`, zmienne `AI_PROVIDER`,
  `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` w schemacie `astro:env`.
- **Zakres (pliki/obszary):**
  ```globs
  src/lib/services/generation.service.ts
  src/lib/supabase.ts
  src/lib/ai/index.ts
  src/pages/api/generations/**
  astro.config.mjs
  .env.example
  wrangler.jsonc
  ```
- **Kontrakt:** `POST /api/generations` body `{ text }` → 201
  `{ generation, candidates }`; 400 `{ error, reason }` przy walidacji;
  502 `{ error, code }` przy błędzie AI (generacja zapisana jako `failed`).
  `POST /api/generations/:id/save` body `{ decisions: SaveDecision[] }` →
  200 `SaveGenerationResult`; 409 gdy generacja nie jest `draft`; 404 gdy
  nie należy do użytkownika (RLS).

### Faza 3: UI generowania, decyzji i decka
- **Intencja:** wyspa React `GenerateFlow` na `/generate`: textarea z licznikiem
  i walidacją po stronie klienta, stan ładowania, lista kandydatów z akcjami
  akceptuj / edytuj (inline, walidacja 1-200 / 1-500) / odrzuć / cofnij,
  przycisk "Zapisz do decka (N)" aktywny gdy N > 0, po zapisie
  `location.assign('/deck?saved=<id>')`. `/deck` SSR: lista fiszek
  (najnowsze na górze) i baner podsumowania generacji z `?saved=`.
  UI po polsku, `data-testid` dla e2e.
- **Zakres (pliki/obszary):**
  ```globs
  src/components/generate/**
  src/components/deck/**
  src/components/hooks/**
  src/pages/generate.astro
  src/pages/deck.astro
  src/styles/global.css
  ```
- **Kontrakt:** stany kandydata w UI = `CandidateState` z `src/types.ts`;
  bez zapisu pojedynczych decyzji na serwerze (decyzje lecą w jednym
  żądaniu save; FR-009).

### Faza 4: e2e pełnej pętli i CI
- **Intencja:** `tests/e2e/gated-generation.spec.ts`: nowy użytkownik,
  tekst 300 znaków → komunikat, brak kandydatów (R4); tekst 1 200 znaków →
  5 kandydatów z mocka; decyzje 2 accept / 1 edit / 1 reject / 1 pending;
  zapis; `/deck` ma dokładnie 3 fiszki z tej generacji (w tym edytowana),
  podsumowanie 5/2/1/1 (R1, R7). Sekrety `SUPABASE_URL`/`SUPABASE_KEY`
  w GitHub Actions (klucz publishable), żeby e2e w CI nie było pomijane.
- **Zakres (pliki/obszary):**
  ```globs
  tests/e2e/**
  .github/workflows/ci.yml
  context/foundation/test-plan.md
  ```
- **Kontrakt:** e2e na `AI_PROVIDER=mock`; mock zwraca dokładnie 5 kandydatów
  dla tekstu z co najmniej 5 zdaniami.

## Success criteria
- [x] `npm test` zielony (25 testów), w tym `gate.test.ts` z przypadkiem US-005
  (3 fiszki, statystyka 5/2/1/1) i `openrouter-provider.test.ts` (4 przypadki R5).
- [x] `npm run test:e2e` zielony lokalnie (7/7; CI z sekretami Supabase od tego commita), w tym
  `gated-generation.spec.ts` (R1): po zapisie w decku są 3 fiszki, odrzucona
  i nierozstrzygnięta nie.
- [x] `curl -X POST /api/generations` z 300 znakami → 400 i zero wierszy
  w `generations` (R4).
- [x] Ręcznie z `AI_PROVIDER=openrouter`: prawdziwa generacja z tekstu lekcji
  kursu daje sensownych kandydatów; wynik (model, liczba, czas) zapisany w
  `## Wynik`.
- [x] `npm run lint`, `astro check`, `npm run build` zielone.

## Risks / open questions
- **Model OpenRouter:** ID i zachowanie JSON-mode do sprawdzenia w
  implementacji (skill `claude-api` nie dotyczy; to API OpenAI-compatible).
  Reakcja: adapter parsuje też JSON wycięty z tekstu, gdy model owinie go
  w markdown.
- **Limit CPU Workera** przy parsowaniu 10 000 znaków: zmierzyć przy F-02.
- **Wyspa React a sesja:** żądania `fetch` z przeglądarki do `/api/*` idą
  z ciasteczkami Supabase automatycznie (same-origin); middleware zwraca 401,
  gdy sesja wygasła; UI pokazuje wtedy link do logowania.
- **Użytkownicy e2e** w `auth.users` przybywają z każdym przebiegiem;
  sprzątanie ręczne (wątek w PROJECT_STATUS).

## Progress
- [x] Faza 1 - adapter AI i czysta logika bramki (commit: fe161ca)
- [x] Faza 2 - usługa generacji i API (commit: 3b27ef5)
- [x] Faza 3 - UI generowania, decyzji i decka (commit: 099e16b)
- [x] Faza 4 - e2e pełnej pętli i CI (commit: 22ee78d)
- [x] Review (review.md, werdykt: MERGE PO POPRAWKACH P1, wdrożone 2026-09-07)
      Wspólny review kodu F-01/S-01/S-02 drugim dostawcą (Codex gpt-5.5):
      `audits/review-code-2026-09-07.md`, tabela rozliczenia na końcu.

## Pomiar użycia
`select count(*), sum(accepted_count + edited_count) as saved_cards from
generations where status = 'saved'` na projekcie hostowanym, odczyt
2026-09-14 (dzień oddania) i zapis liczby w `## Wynik`. Wskaźnik akceptacji
z PRD: `(accepted_count + edited_count) / generated_count`.

## Wynik
Wszystkie cztery fazy dowiezione 2026-09-07 w jednej sesji. Pełna pętla
działa na mocku (e2e 7/7 lokalnie) i na prawdziwym OpenRouter.

- **Prawdziwa generacja:** model `google/gemini-2.5-flash-lite`, fragment
  lekcji m2l1 o vertical-first (2 508 znaków) → 9 kandydatów w 3,5 s, wszystkie
  sensowne pytanie/odpowiedź po polsku; koszt rzędu tysięcznych centa.
- **Bug znaleziony dopiero na prawdziwym wywołaniu:** `fetch` przekazany jako
  właściwość obiektu i wołany jako metoda daje w workerd "Illegal invocation";
  mock w testach unit tego nie łapie. Poprawka df3f1d7, lekcja w `lessons/`.
- **Smoke API przez curl** wymaga nagłówka `Origin` (ochrona CSRF Astro),
  inaczej 403; przeglądarka wysyła go sama.
- **Odstępstwa od planu:** brak. Sekrety Supabase dodane do GitHub Actions,
  więc e2e w CI przestaje być pomijane (zmiana wobec tech-stack D7: e2e w CI
  idzie na projekt hostowany, bez lokalnego Supabase).
- **Dług:** review planu drugim dostawcą nie wykonane (czas); użytkownicy
  `e2e-*`/`smoke-*@example.com` przybywają w `auth.users`.
