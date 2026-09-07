# Plan 0901 - bootstrap-auth-schema

- **Pozycja roadmapy:** F-01 (numer katalogu z ID: `F-01` → `0901`)
- **Złożoność:** średnia
- **Akceptacja:** 2026-09-07, Tomasz (zgoda z góry w sesji: "rób plan F-01 i wykonuj")
- **Status:** w realizacji
- **Research:** nie był potrzebny, bo starter został przeczytany w całości
  w sesji powołania (`tech-stack.md` nagłówek `starter_commit`), a schemat
  wynika wprost z modelu danych w `prd.md`.

## End state

Repo zawiera działającą aplikację ze startera: `npm run dev` startuje, rejestracja
i logowanie emailem i hasłem działają na hostowanym Supabase, trasy `/generate`
i `/deck` (na razie puste strony) przekierowują niezalogowanego na `/auth/signin`.
W `supabase/migrations/` jest schemat `generations`, `flashcard_candidates`,
`flashcards` z RLS per operacja i funkcja RPC `save_generation` w jednej
transakcji. Vitest i Playwright są zainstalowane z testem dymnym każdy,
`npm test` i `npm run test:e2e` przechodzą, CI GitHub Actions (lint, check,
unit, build) jest zielone na `main`. Bramki husky działają, `lefthook.yml`
i `.forgejo/` nie istnieją.

## Fazy

### Faza 1: kopia startera i bramki

- **Intencja:** przenieść `10x-astro-starter@69c0bfa` do repo bez jego historii,
  usunąć artefakty szkieletu floty sprzeczne z O2/O3, przestawić CI na `main`,
  zainstalować zależności i potwierdzić, że lint, check i build przechodzą.
- **Zakres (pliki/obszary):**
  ```globs
  package.json
  package-lock.json
  astro.config.mjs
  wrangler.jsonc
  tsconfig.json
  components.json
  eslint.config.js
  .prettierrc.json
  .nvmrc
  .gitignore
  .env.example
  .husky/**
  .vscode/**
  .github/workflows/**
  public/**
  src/**
  supabase/config.toml
  lefthook.yml          # usunięcie
  .forgejo/**           # usunięcie
  README.md
  ```
- **Kontrakt:** pliki startera kopiowane bez zmian poza: gałąź CI `master` →
  `main`, `.nvmrc` → `22`, nazwa Workera w `wrangler.jsonc` → `app-10xcards`,
  `CLAUDE.md` startera **nie** nadpisuje naszego (`@AGENTS.md`); jego treść
  ("Rules for AI") trafia do sekcji w `AGENTS.md`.

### Faza 2: trasy produktu i ochrona

- **Intencja:** strony `/generate` i `/deck` jako szkielety (layout, nagłówek,
  wylogowanie) i wpis w `PROTECTED_ROUTES`; `/dashboard` ze startera usunięty,
  po zalogowaniu przekierowanie na `/generate`. Landing `/` opisuje produkt.
- **Zakres (pliki/obszary):**
  ```globs
  src/middleware.ts
  src/pages/index.astro
  src/pages/generate.astro
  src/pages/deck.astro
  src/pages/dashboard.astro   # usunięcie
  src/pages/api/auth/**
  src/components/**
  src/layouts/**
  ```
- **Kontrakt:** API auth ze startera bez zmian poza redirectem po signin;
  FR-003 spełnione dla obu tras.

### Faza 3: schemat bazy, RLS, RPC, typy

- **Intencja:** migracja `supabase/migrations/<ts>_initial_schema.sql`
  z tabelami wg `prd.md` (model danych), RLS włączone z politykami per
  operacja (`select/insert/update/delete` dla `auth.uid() = user_id`),
  funkcja `save_generation(p_generation_id uuid, p_decisions jsonb)`
  (`security invoker`, jedna transakcja, waliduje właściciela i stan
  `draft`, tworzy fiszki z `accepted`/`edited`, zapisuje statystykę, zamyka
  generację). Migracja wypchnięta na projekt hostowany (`supabase link` +
  `db push`), typy wygenerowane do `src/db/types.ts`.
- **Zakres (pliki/obszary):**
  ```globs
  supabase/migrations/**
  supabase/config.toml
  src/db/**
  src/types.ts
  ```
- **Kontrakt:** nazwy tabel i kolumn z tego planu są kontraktem dla S-01
  i S-02:
  `generations(id, user_id, source_text, source_length, model, status,
generated_count, accepted_count, edited_count, rejected_count, created_at,
saved_at, error_message)`,
  `flashcard_candidates(id, generation_id, user_id, front, back, edited_front,
edited_back, state, position, created_at)`,
  `flashcards(id, user_id, front, back, source_generation_id, created_at,
updated_at)`.
  Stany: `generations.status ∈ {draft, saved, failed}`,
  `flashcard_candidates.state ∈ {pending, accepted, edited, rejected}`.
  **Zależy od H-1** (projekt Supabase); do tego czasu migracja i typy powstają
  lokalnie, `db push` i `gen types` wykonane po podpięciu.

### Faza 4: testy dymne i CI

- **Intencja:** Vitest (`tests/unit/smoke.test.ts` na `validateSourceText`
  z limitami 1 000 - 10 000, czyli od razu R4) i Playwright
  (`tests/e2e/auth-guard.spec.ts`: `/generate` bez sesji → `/auth/signin`,
  czyli R6) działają lokalnie; pre-push husky uruchamia `npm test`;
  pre-commit dodatkowo grep sekretów; CI: lint, `astro check`, `vitest run`,
  build.
- **Zakres (pliki/obszary):**
  ```globs
  tests/**
  vitest.config.ts
  playwright.config.ts
  package.json
  .husky/**
  .github/workflows/**
  src/lib/services/validate-source-text.ts
  ```
- **Kontrakt:** e2e na `AI_PROVIDER=mock` i bez zależności od OpenRouter;
  CI nie wymaga sekretów Supabase (starter obsługuje ich brak).

## Success criteria

- [ ] `npm run lint && npx astro check && npm run build` kończą się kodem 0.
- [ ] `npm test` przechodzi i zawiera test graniczny 999/1000/10000/10001 (R4).
- [ ] `npm run test:e2e` przechodzi: wejście na `/generate` bez sesji kończy
      się URL-em `/auth/signin` (R6).
- [ ] Po `supabase db push` zapytanie `select tablename from pg_tables where
schemaname='public'` zwraca trzy tabele, a `select relrowsecurity from
pg_class where relname='flashcards'` zwraca `t`.
- [ ] Rejestracja i logowanie przez UI na hostowanym Supabase działają
      (ręcznie, screenshot do `deployment/` przy F-02).
- [ ] `test ! -e lefthook.yml && test ! -d .forgejo` prawda; workflow CI na
      GitHub zielony dla ostatniego commita `main`.

## Risks / open questions

- **H-1 (projekt Supabase) nieuzupełnione** blokuje `db push`, `gen types`
  i ręczną weryfikację auth. Reakcja: fazy 1, 2, 4 i pisanie migracji idą
  bez tego; faza 3 domyka się po H-1.
- Brak Dockera na Macu: lokalny Supabase niedostępny, więc testy
  integracyjne z test-planu (R2, R3) pójdą na hostowany projekt z osobnymi
  użytkownikami testowymi; zapisane jako zmiana w Cookbooku test-planu.
- Wersje startera są z sierpnia 2026 (`^` w package.json): `npm install`
  może wciągnąć nowsze minory; `package-lock.json` startera kopiujemy, żeby
  zamrozić to, co starter testował.
- **Zaakceptowane ryzyko (2026-09-07):** po `npm audit fix` zostają 2 high
  (astro 6.3: XSS przez nazwy atrybutów w spread props; sharp przez libvips)
  z poprawką tylko w Astro 7 (major). Nie używamy spread props z nazwami
  z zewnątrz ani przetwarzania obrazów; migracja na Astro 7 tydzień przed
  terminem to większe ryzyko niż podatność. Do rewizji po certyfikacji.

## Progress

- [x] Faza 1 - kopia startera i bramki (commit: 87f2a48)
- [x] Faza 2 - trasy produktu i ochrona (commit: 0ae6c36)
- [ ] Faza 3 - schemat bazy, RLS, RPC, typy (commit: 85d4c67)
      Migracja i `src/types.ts` są w repo; czeka na H-1 (projekt Supabase):
      `npx supabase link`, `npx supabase db push`, `npx supabase gen types
    typescript --linked > src/db/types.ts`, ręczna rejestracja i logowanie.
- [x] Faza 4 - testy dymne i CI (commit: ae5bbb2)
      Wykonana przed domknięciem fazy 3, bo nie zależy od Supabase. Lokalnie:
      lint 0 błędów, `astro check` 0 błędów, Vitest 6/6, Playwright 4/4, build OK.
- [ ] Review (review.md, werdykt: )

## Pomiar użycia

Nie dotyczy jako osobny pomiar: fundament jest używany przez S-01 z definicji
(pierwszy zapis kandydata w `flashcard_candidates`). Odczyt: `select count(*)
from generations` po pierwszej sesji S-01, data: przy domknięciu S-01.

## Wynik

{{wypełniane na końcu}}
