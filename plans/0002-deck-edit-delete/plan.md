# Plan 0002 - deck-edit-delete

- **Pozycja roadmapy:** S-02 (numer katalogu z ID: `S-02` → `0002`)
- **Złożoność:** niska
- **Akceptacja:** 2026-09-07, Tomasz ("rób S-02")
- **Status:** w realizacji
- **Research:** nie był potrzebny; tabela `flashcards` z politykami RLS per
  operacja istnieje od planu 0901, brakuje tras API i UI.

## End state

W decku każda fiszka ma "Edytuj" (inline: przód 1-200, tył 1-500, zapis
trwały) i "Usuń" (z potwierdzeniem w miejscu, bez okna dialogowego
przeglądarki). Zmiany są widoczne po odświeżeniu i na produkcji. Użytkownik
A nie może odczytać, zmienić ani usunąć fiszki użytkownika B po ID: API
odpowiada 404, dane B nietknięte (FR-004, US-009). Test integracyjny RLS
(R3) i e2e edycji/usuwania są zielone lokalnie i w CI. Milestone `mvp`
z roadmapy domknięty.

## Fazy

### Faza 1: API i test IDOR
- **Intencja:** `flashcard.service.ts` (`updateFlashcard`, `deleteFlashcard`
  z wykryciem "0 wierszy" jako 404), trasy `PATCH` i `DELETE`
  `/api/flashcards/[id]` z walidacją zod (limity FR-016), test
  integracyjny `tests/integration/idor.test.ts` na hostowanym Supabase:
  dwóch świeżych użytkowników, A tworzy fiszkę, B próbuje select/update/
  delete po ID i widzi 0 wierszy, fiszka A bez zmian (R3).
- **Zakres (pliki/obszary):**
  ```globs
  src/lib/services/flashcard.service.ts
  src/pages/api/flashcards/**
  tests/integration/**
  vitest.config.ts
  ```
- **Kontrakt:** `PATCH /api/flashcards/:id` body `{ front, back }` → 200
  `Flashcard`; 400 przy walidacji; 404 gdy brak lub cudza. `DELETE` → 204;
  404 gdy brak lub cudza. Oba wymagają sesji (middleware: 401).

### Faza 2: UI decka
- **Intencja:** wyspa React `DeckList` (props: fiszki z SSR): karta z
  przód/tył, "Edytuj" → formularz inline z licznikami, "Zapisz" / "Anuluj";
  "Usuń" → potwierdzenie inline "Na pewno? Usuń / Anuluj"; po sukcesie stan
  lokalny aktualizowany, błąd API pokazany przy karcie. `deck.astro`
  renderuje wyspę zamiast statycznej listy; baner podsumowania zostaje SSR.
- **Zakres (pliki/obszary):**
  ```globs
  src/components/deck/**
  src/pages/deck.astro
  ```
- **Kontrakt:** `data-testid` dla e2e: `flashcard`, `flashcard-front`,
  `flashcard-back`, `card-edit`, `card-delete`, `card-confirm-delete`,
  `card-edit-front`, `card-edit-back`, `card-save`.

### Faza 3: e2e, deploy, dokumenty
- **Intencja:** `tests/e2e/deck-edit-delete.spec.ts`: użytkownik generuje na
  mocku, zapisuje 2 fiszki, edytuje tył jednej (widoczny po odświeżeniu),
  usuwa drugą (nie wraca po odświeżeniu); drugi kontekst przeglądarki jako
  użytkownik B woła `PATCH`/`DELETE` na ID fiszki A przez `request` → 404
  (US-009 na poziomie API). Deploy na produkcję z rollback testem
  (`wrangler rollback` na poprzednią wersję i z powrotem), test-plan R2/R3
  statusy, roadmapa S-02 done i milestone `mvp`.
- **Zakres (pliki/obszary):**
  ```globs
  tests/e2e/**
  context/foundation/test-plan.md
  context/foundation/roadmap.md
  deployment/deploy-plan.md
  ```
- **Kontrakt:** bez zmian API względem fazy 1.

## Success criteria
- [ ] `npm test` zielony, w tym `idor.test.ts` (B widzi 0 wierszy przy select,
  update i delete fiszki A; fiszka A ma niezmienioną treść).
- [ ] `npm run test:e2e` zielony, w tym `deck-edit-delete.spec.ts` (edycja
  trwała po reload, usunięta nie wraca, cudze ID → 404).
- [ ] Na produkcji: edycja i usunięcie fiszki przez UI działają (smoke po
  deployu), `wrangler rollback` wykonany i cofnięty.
- [ ] `npm run lint`, `astro check`, `npm run build` zielone; CI zielone.

## Risks / open questions
- Test integracyjny tworzy dwóch użytkowników na hostowanym projekcie przy
  każdym przebiegu (lokalnie i w CI); sprzątanie ręczne, jak dla e2e.
- Limit rejestracji w Supabase Auth (rate limit na sign-up z jednego IP):
  jeśli CI zacznie dostawać 429, testy tworzące użytkowników trzeba
  przełączyć na jednego stałego użytkownika testowego z sekretem.

## Progress
- [ ] Faza 1 - API i test IDOR (commit: )
- [ ] Faza 2 - UI decka (commit: )
- [ ] Faza 3 - e2e, deploy, dokumenty (commit: )
- [ ] Review (review.md, werdykt: )

## Pomiar użycia
`select count(*) from flashcards where updated_at > created_at` (edycje)
na projekcie hostowanym, odczyt 2026-09-14; usunięcia niemierzalne bez
logu (świadomie, MVP).

## Wynik
{{wypełniane na końcu}}
