# PROJECT_STATUS

Jeden plik-odpowiedź: gdzie jesteśmy i od czego kontynuować. Blok generowany jest
wyprowadzany z `## Progress` planów i z gita; resztę pliku piszesz ręcznie.

**Reguła rozmiaru:** kanoniczna „Reguła rozmiaru i cięcia" floty (M-003,
`project-structure/migrations.md`) - definicja, próg i komenda pomiaru
mieszkają wyłącznie tam (M-003 pkt 5).

<!-- generated:begin: python3 tools/status-block.py --print -->
- **Aktywne plany (4):**
  - [`0001-gated-generation-loop`](./plans/0001-gated-generation-loop/plan.md) - Plan 0001 - gated-generation-loop - fazy 4/4 - review: brak - ostatni commit `31f1c83` (2026-09-07)
  - [`0002-deck-edit-delete`](./plans/0002-deck-edit-delete/plan.md) - Plan 0002 - deck-edit-delete - fazy 3/3 - review: brak - ostatni commit `d16f692` (2026-09-07)
  - [`0901-bootstrap-auth-schema`](./plans/0901-bootstrap-auth-schema/plan.md) - Plan 0901 - bootstrap-auth-schema - fazy 4/4 - review: brak - ostatni commit `5b48f10` (2026-09-07)
  - [`0902-first-prod-deploy`](./plans/0902-first-prod-deploy/plan.md) - Plan 0902 - first-prod-deploy - fazy 3/3 - review: brak - ostatni commit `96b35d0` (2026-09-07)
- **Ostatnio domknięty plan:** brak
- **Plany zarchiwizowane:** 0
<!-- generated:end -->

- **Ostatnia aktualizacja:** 2026-09-07
- **Etap:** E5: MVP kompletne w kodzie (F-01, S-01, F-02, S-02); przed oddaniem
- **Publiczny URL:** https://app-10xcards.tomasz-sinkiewicz.workers.dev
- **Następny krok:** uruchomić `mvp-check.md` na repo i poprawić braki; potem
  H-8 (URL z innej sieci), H-4 (repo publiczne albo współpracownicy), H-5
  (oficjalny PRD), sprzątanie użytkowników testowych w Supabase Auth, review
  planów drugim dostawcą jeśli czas, formularz certyfikacji do 2026-09-14.
- **Termin twardy:** zgłoszenie do certyfikacji 10xBuilder do 2026-09-14 23:59
  (trzeci, ostatni termin).

## Wątki otwarte

- Oficjalny PRD 10xCards z preworku 4.2 (platforma kursu) nieporównany
  z `prd.md`; różnice do dopisania albo świadomego odrzucenia (H-5).
- Konta zewnętrzne do założenia przez człowieka: OpenRouter H-2, Cloudflare H-3; repo GitHub prywatne do czasu decyzji (H-4). Lista w `human/`.
- Review planów 0901 i 0001 drugim dostawcą (Codex) nie wykonane; do zrobienia
  przed oddaniem, jeśli czas pozwoli, inaczej zapis w Wyniku planów.
- `npm audit`: 2 high bez poprawki poza Astro 7 (major); ryzyko przyjęte,
  zapis w planie 0901 §Risks. Rewizja po certyfikacji.
- Użytkownicy testowi `e2e-<timestamp>@example.com` przybywają w `auth.users`
  z każdym lokalnym przebiegiem e2e; posprzątać w dashboardzie przed oddaniem.

## Dziennik (najnowsze na górze) <!-- dziennik -->

### 2026-09-07 (sesja 5: S-02)

- S-02: PATCH/DELETE `/api/flashcards/:id`, `DeckList` z edycją inline
  i usuwaniem z potwierdzeniem, test integracyjny RLS (R3) i atomowości (R2),
  e2e edycji/usuwania z IDOR na poziomie API. Vitest 32, Playwright 9/9.
- Wyścig hydracji React wykryty przez e2e; hook `useHydrated` + `fieldset
  disabled`. Deploy S-02 na produkcję, rollback przetestowany w obie strony.

### 2026-09-07 (sesja 4: F-02)

- Pierwszy deploy na Cloudflare Workers (`wrangler deploy`), sekrety przez
  `wrangler secret put`, produkcja na `google/gemini-2.5-flash-lite`: 2,5 k
  znaków → 8 fiszek w 3,0 s, 10 k → 11 fiszek w 3,9 s, bez limitu CPU.
- Bug: `astro:env` `access: "public"` wstrzykiwane z `.env` przy buildzie,
  produkcja poszła na mocku; poprawka na `access: "secret"`, lekcja w `lessons/`.
- Runbook `deploy-cloudflare.md`, `deployment/deploy-plan.md`, H-8 (Safe
  Browsing z innej sieci) dla Tomasza.

### 2026-09-07 (sesja 3: S-01)

- S-01 w 4 fazach: adapter AI (mock + OpenRouter z ponowieniem i zod),
  serwis generacji i API (`POST /api/generations`, `.../save` przez RPC),
  wyspa React z decyzjami per kandydat, deck SSR z podsumowaniem, e2e pełnej
  pętli (R1) zielone 7/7. Prawdziwa generacja gemini-2.5-flash-lite: 9 fiszek
  z lekcji m2l1 w 3,5 s. Sekrety Supabase w GitHub Actions, e2e w CI realne.
- Bug workerd "Illegal invocation" przy `fetch` jako właściwości obiektu;
  lekcja w `lessons/`.

### 2026-09-07 (sesja 2: F-01)

- H-1 domknięte z Tomaszem krok po kroku: projekt Supabase `pmexsftaconiyztrvjuu`,
  Confirm email off, CLI login w Terminalu (sesja agenta nie ma TTY), link,
  `db push`, `gen types`, e2e rejestracji i logowania zielony. F-01 gotowy.
- Plan 0901 napisany i wykonany w 3 z 4 faz: starter skopiowany (Astro 6,
  Supabase SSR auth, Cloudflare, husky), `/generate` i `/deck` chronione,
  UI po polsku, migracja z RLS i RPC `save_generation` w repo, Vitest (R4)
  i Playwright (R6) zielone lokalnie, CI GitHub Actions (checks + e2e).
- Lekcja techniczna: `return Astro.redirect()` w frontmatterze strony
  wywala `@typescript-eslint/no-misused-promises` (astro-eslint-parser);
  przekierowania idą przez middleware.
- lint-staged formatuje też `*.md`, więc prettier przepisuje dokumenty
  w `context/` i `plans/` przy commicie; akceptowalne.

### 2026-09-07 (sesja 1: powołanie)

- Powołanie projektu ze szkieletu `project-structure` (rdzeń + moduł software).
- Decyzja: dokumenty fundamentu w `context/foundation/` (odstępstwo O1 w
  AGENTS.md), bo tak szuka ich mvp-check kursu.
- `shape-notes.md` i `prd.md` napisane i zaakceptowane (16 FR, 10 US, reguła
  bramki akceptacji z atomowym zapisem; SRS i ręczne fiszki w non-goals).
- Wybory z sesji: 10x Astro Starter (Astro + React + Supabase), OpenRouter,
  Cloudflare, termin trzeci (14.09.2026).
- Repo `origin` na GitHub (`overblast-sketch/app-10xcards`, prywatne na
  razie), Forgejo pominięte (O2).
- Kontrakty `tech-stack.md` (D1-D9, starter 69c0bfa), `infrastructure.md`
  (Cloudflare Workers + Supabase EU, ryzyka z pre-mortem), `roadmap.md`
  (F-01 → S-01 → F-02 → S-02, S-03 SRS parked) i `test-plan.md` (R1-R7,
  R1 e2e jako test certyfikacyjny) napisane.
