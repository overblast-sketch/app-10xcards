# Roadmap - app-10xcards

<!-- Kolejność pracy: W JAKIEJ KOLEJNOŚCI. Powstaje z prd.md. Szablon:
     project-structure/templates/roadmap.md. Tabela "At a glance" jest kontraktem
     maszynowym (ADR-0004 floty); numer planu wynika z ID (ADR-0006):
     S-01 -> plans/0001-*, F-01 -> plans/0901-*, F-02 -> plans/0902-*. -->

## Vision recap

Zalogowany learner wkleja tekst, AI proponuje fiszki, człowiek jest bramką:
każdą akceptuje, poprawia albo odrzuca; do decka trafiają tylko zaakceptowane,
zapisane atomowo. Deck pozwala przeglądać, edytować i usuwać. Główny cel
roadmapy (`main_goal`): **speed**; największy bloker (`top_blocker`): **czas**
(termin 2026-09-14). Powtórki SRS poza zakresem tej wersji.

## North star

**S-01 gated generation loop** działający na publicznym URL i przechodzący
test e2e: wklej tekst → kandydaci → decyzje → zapis → fiszki w decku.
Milestone `mvp` domyka się, gdy do tego dochodzi S-02 (edycja i usuwanie
w decku, czyli pełny CRUD) i F-02 (produkcja).

## At a glance

| ID   | Nazwa                 | Status          | Depends    | Unlocks |
| ---- | --------------------- | --------------- | ---------- | ------- |
| F-01 | bootstrap-auth-schema | done 2026-09-07 | -          | S-01    |
| S-01 | gated-generation-loop | done 2026-09-07 | F-01       | S-02    |
| F-02 | first-prod-deploy     | todo            | F-01       | S-02    |
| S-02 | deck-edit-delete      | todo            | S-01, F-02 | -       |
| S-03 | srs-review-session    | todo parked     | S-02       | -       |

## Baseline

Repo ma wyłącznie dokumenty (`context/foundation/`), szkielet meta-struktury
i pusty `src/`. Kod aplikacji nie istnieje; starter `10x-astro-starter`
(Astro 6 SSR, Supabase Auth email+hasło, middleware `PROTECTED_ROUTES`,
adapter Cloudflare, husky, CI lint+build) jest sklonowany do analizy
i zostanie skopiowany w F-01.

## Foundations

### F-01 bootstrap-auth-schema

Starter skopiowany do repo, zależności i bramki działają, trasy `/generate`
i `/deck` chronione middlewarem, projekt Supabase podpięty, migracja
`generations` / `flashcard_candidates` / `flashcards` z RLS i funkcją RPC
`save_generation`, typy wygenerowane, Vitest i Playwright zainstalowane
z jednym testem dymnym każdy. Pokrywa FR-001 do FR-004 (auth ze startera,
własność na warstwie danych). Odblokowuje S-01, bo bez schematu i auth nie
ma gdzie zapisać kandydatów.

- **Zakres (pliki/obszary):**
  ```globs
  package.json
  astro.config.mjs
  wrangler.jsonc
  src/middleware.ts
  src/lib/supabase.ts
  src/db/**
  supabase/migrations/**
  tests/**
  playwright.config.ts
  vitest.config.ts
  .github/workflows/**
  ```

### F-02 first-prod-deploy

Pierwszy deploy na Cloudflare Workers z sekretami, migracje wypchnięte na
projekt hostowany, rejestracja i logowanie działają pod publicznym URL,
checklista `deployment/deploy-plan.md` spisana po pierwszym udanym
przebiegu. Odblokowuje S-02, bo S-02 ma być weryfikowany już na produkcji,
a wczesny deploy wykrywa ryzyka z `infrastructure.md` (Safe Browsing,
sekrety, limit CPU) zanim skończy się czas.

- **Zakres (pliki/obszary):**
  ```globs
  deployment/**
  wrangler.jsonc
  .github/workflows/**
  README.md
  ```

## Slices

### S-01 gated-generation-loop

- **Outcome:** user can paste source text, request a candidate batch, accept /
  edit / reject each candidate, save accepted ones atomically and see them
  in the deck list.
- **Change ID:** gated-generation-loop
- **PRD refs:** US-003, US-004, US-005, US-006, US-010; FR-005 do FR-013,
  FR-016
- **Prerequisites:** F-01
- **Parallel with:** F-02
- **Blockers:** klucz OpenRouter (H-2) tylko dla prawdziwej generacji;
  implementacja i e2e idą na `MockProvider`.
- **Unknowns:** ID taniego modelu w OpenRouter i jakość JSON-mode - Owner:
  agent przy planie. Block: no (mock odblokowuje pracę).
- **Risk:** to jest klin produktu i cała logika biznesowa wymagana do
  certyfikacji; idzie pierwszy, bo S-02 edytuje to, co S-01 zapisze.
- **Status:** done 2026-09-07 (plan 0001)
- **Zakres (pliki/obszary):**
  ```globs
  src/lib/services/**
  src/lib/ai/**
  src/pages/api/generations/**
  src/pages/generate.astro
  src/pages/deck.astro
  src/components/generate/**
  src/components/deck/**
  src/types.ts
  tests/**
  ```

### S-02 deck-edit-delete

- **Outcome:** user can edit front/back of a saved flashcard and delete it
  after confirmation; changes persist and are visible after reload, on
  production.
- **Change ID:** deck-edit-delete
- **PRD refs:** US-007, US-008, US-009; FR-013 do FR-016, FR-004
- **Prerequisites:** S-01, F-02
- **Parallel with:** -
- **Blockers:** -
- **Unknowns:** -
- **Risk:** domyka Update i Delete wymagane przez mvp-check oraz test IDOR
  (US-009); ostatni przed oddaniem, bo najmniej ryzykowny technicznie.
- **Status:** todo
- **Zakres (pliki/obszary):**
  ```globs
  src/pages/api/flashcards/**
  src/pages/deck.astro
  src/components/deck/**
  tests/**
  ```

### S-03 srs-review-session (parked)

- **Outcome:** user can review due cards and grade them; next due date
  computed by an SRS library.
- **Change ID:** srs-review-session
- **PRD refs:** brak (non-goal w tej wersji PRD; wymaga aneksu do PRD)
- **Prerequisites:** S-02
- **Status:** todo parked - poza zakresem certyfikacji; wraca po 14.09.2026
  jako nowa faza z własną decyzją (patrz `shape-notes.md`, warunek
  zakończenia).

## Milestones

| Milestone | Definicja (co musi działać)                                                                                    | Status |
| --------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| mvp       | F-01, S-01, F-02, S-02 done; test e2e S-01 zielony lokalnie; mvp-check 5/5; publiczny URL działa z innej sieci | ⬜     |
| submitted | formularz certyfikacji wysłany przed 2026-09-14 23:59 z linkiem do repo i URL                                  | ⬜     |

## Backlog Handoff

Bez zewnętrznego trackera: roadmapa + `plans/NNNN-*/plan.md` + `PROJECT_STATUS.md`
są jedynym systemem prawdy (jeden użytkownik, tydzień pracy).

## Open Roadmap Questions

- Czy oficjalny PRD z preworku 4.2 dodaje wymagania must-have (H-5)? Jeśli
  tak, trafiają do S-01 albo S-02, nie do nowego slice'a.

## Parked

- Ręczne tworzenie fiszek od zera (Create pokryte przez zapis kandydatów).
- Import PDF/DOCX/URL, współdzielenie decków, usuwanie konta z retencją,
  statystyki nauki, obserwowalność ponad `wrangler tail`, preview per PR,
  e2e w CI (D7), deploy z CI.

## Done

- F-01 bootstrap-auth-schema (plan 0901, 2026-09-07)
- S-01 gated-generation-loop (plan 0001, 2026-09-07)
- F-02 first-prod-deploy (plan 0902, 2026-09-07): https://app-10xcards.tomasz-sinkiewicz.workers.dev
