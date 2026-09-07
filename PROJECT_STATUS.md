# PROJECT_STATUS

Jeden plik-odpowiedź: gdzie jesteśmy i od czego kontynuować. Blok generowany jest
wyprowadzany z `## Progress` planów i z gita; resztę pliku piszesz ręcznie.

**Reguła rozmiaru:** kanoniczna „Reguła rozmiaru i cięcia" floty (M-003,
`project-structure/migrations.md`) - definicja, próg i komenda pomiaru
mieszkają wyłącznie tam (M-003 pkt 5).

<!-- generated:begin: python3 tools/status-block.py --print -->
- **Aktywne plany (1):**
  - [`0901-bootstrap-auth-schema`](./plans/0901-bootstrap-auth-schema/plan.md) - Plan 0901 - bootstrap-auth-schema - fazy 4/4 - review: brak - ostatni commit `8402e67` (2026-09-07)
- **Ostatnio domknięty plan:** brak
- **Plany zarchiwizowane:** 0
<!-- generated:end -->

- **Ostatnia aktualizacja:** 2026-09-07
- **Etap:** E2: F-01 wykonany (plan 0901: 4/4 fazy, czeka na review)
- **Następny krok:** plan `plans/0001-gated-generation-loop/plan.md` (S-01)
  i implementacja na `MockProvider`; review planu 0901 sesją Codex, gdy czas
  pozwoli (nie blokuje S-01).
- **Termin twardy:** zgłoszenie do certyfikacji 10xBuilder do 2026-09-14 23:59
  (trzeci, ostatni termin).

## Wątki otwarte

- Oficjalny PRD 10xCards z preworku 4.2 (platforma kursu) nieporównany
  z `prd.md`; różnice do dopisania albo świadomego odrzucenia (H-5).
- Konta zewnętrzne do założenia przez człowieka: OpenRouter H-2, Cloudflare H-3; repo GitHub prywatne do czasu decyzji (H-4). Lista w `human/`.
- `npm audit`: 2 high bez poprawki poza Astro 7 (major); ryzyko przyjęte,
  zapis w planie 0901 §Risks. Rewizja po certyfikacji.
- Użytkownicy testowi `e2e-<timestamp>@example.com` przybywają w `auth.users`
  z każdym lokalnym przebiegiem e2e; posprzątać w dashboardzie przed oddaniem.

## Dziennik (najnowsze na górze) <!-- dziennik -->

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
