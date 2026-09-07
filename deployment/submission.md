# Zgłoszenie do certyfikacji 10xBuilder (10xDevs 3.0, termin 3: 2026-09-14)

Materiał do formularza zgłoszeniowego na platformie. Do wklejenia w polach
formularza (skopiuj sekcje), plus lista screenshotów do zrobienia.

## Linki

- Repozytorium (publiczne): https://github.com/overblast-sketch/app-10xcards
- Aplikacja (publiczny URL): https://app-10xcards.tomasz-sinkiewicz.workers.dev
- Raport mvp-check: `audits/mvp-check-2026-09-07.md` (5/5)

## Opis projektu (pole "Opis")

10xCards, własna wersja projektu kursowego: aplikacja do fiszek, w której AI
generuje kandydatów na fiszki z wklejonego tekstu (1 000 - 10 000 znaków),
a użytkownik jest bramką jakości: każdego kandydata akceptuje, poprawia albo
odrzuca. Do decka trafiają wyłącznie zaakceptowane fiszki, zapisane atomowo
w jednej transakcji; odrzucone i nierozstrzygnięte nigdy. Deck pozwala
przeglądać, edytować i usuwać własne fiszki. Każda generacja zapisuje
statystykę akceptacji (kryterium sukcesu z PRD: 75% akceptacji).

Stack: Astro 6 (SSR) + React 19 + TypeScript + Tailwind, Supabase (auth email
i hasło, Postgres z RLS per operacja, funkcja PL/pgSQL `save_generation`),
OpenRouter (`google/gemini-2.5-flash-lite`) za adapterem z deterministycznym
mockiem do testów, Cloudflare Workers. Baza: 10x Astro Starter z kursu.

Logika biznesowa jednym zdaniem: fiszka trafia do decka wyłącznie po jawnej
decyzji człowieka o kandydacie wygenerowanym przez AI, a zapis
zaakceptowanych jest atomowy.

## Jak spełniam wymagania (pole "Twój komentarz")

1. Kontrola dostępu: Supabase Auth (rejestracja i logowanie email + hasło),
   middleware chroni `/generate` i `/deck` oraz API; każdy zasób ma
   właściciela, RLS `auth.uid() = user_id` na wszystkich tabelach; test
   integracyjny IDOR i test e2e (cudza fiszka przez API → 404).
2. CRUD: fiszki tworzone przez zapis generacji (RPC), czytane w decku,
   edytowane (`PATCH /api/flashcards/:id`) i usuwane (`DELETE`), trwałość
   sprawdzana w e2e po odświeżeniu. Ręczne tworzenie od zera to świadomy
   non-goal w PRD (Create jest pokryte zapisem kandydatów).
3. Logika biznesowa: bramka akceptacji i atomowy zapis w transakcji
   (`supabase/migrations/20260907090000_initial_schema.sql`, `src/lib/services/gate.ts`),
   walidacja tekstu, adapter AI z timeoutem, ponowieniem i walidacją JSON.
4. Dokumenty kontekstowe: `context/foundation/` (shape-notes, prd, tech-stack,
   infrastructure, roadmap, test-plan), `AGENTS.md`, plany zmian
   `plans/archived/*/plan.md` z fazami, kryteriami i wynikiem, `lessons/`,
   `runbooks/`, `deployment/deploy-plan.md`.
5. Testy: risk-based test-plan (R1-R7), każde ryzyko zmapowane na test.
   Test z perspektywy użytkownika: `tests/e2e/gated-generation.spec.ts`
   (pełna pętla: wklej, generuj, decyduj, zapisz, deck; wyrocznia z PRD
   US-005). Razem 34 testy Vitest (unit + integration na hostowanym Supabase)
   i 9 e2e Playwright; review drugim dostawcą (Codex) wdrożone:
   `audits/review-code-2026-09-07.md`.
6. CI/CD: GitHub Actions (`.github/workflows/ci.yml`): lint, `astro check`,
   testy, build oraz osobny job e2e (na sekretach Supabase). Deploy ręczny
   z `wrangler deploy` (runbook), rollback przetestowany.

Uwagi dla sprawdzających:
- Testy integracyjne i e2e wymagające sesji pomijają się bez `SUPABASE_URL`
  i `SUPABASE_KEY` (README, sekcja "Bramki i testy"); w CI sekrety są ustawione.
- Plany zmian trzymam w `plans/` (własna meta-struktura projektów), nie
  w `context/changes/`; dokumenty fundamentu są w `context/foundation/`
  zgodnie z kursem. Odstępstwo zapisane w `AGENTS.md`.
- Artefakty powstawały z Claude Code według workflow kursu (shape → PRD →
  tech-stack → infrastructure → roadmap → plan → implementacja → testy),
  bez oficjalnych skilli `/10x-*` (10x-cli nieuwierzytelnione na tej
  maszynie); review drugim dostawcą (Codex) w `audits/`.
- SRS (powtórki) to świadomy non-goal tej wersji; zaparkowany jako S-03.

## Screenshoty do zrobienia (przed wysyłką)

1. Landing `/` z opisem i przyciskami logowania.
2. Ekran rejestracji lub logowania.
3. `/generate` z wklejonym tekstem i licznikiem znaków.
4. Lista kandydatów po generacji: co najmniej jeden zaakceptowany, jeden
   edytowany (niebieski), jeden odrzucony (czerwony), przycisk "Zapisz do
   decka (N)".
5. `/deck` z banerem podsumowania generacji i listą fiszek.
6. Edycja fiszki inline w decku i potwierdzenie usunięcia.
7. Struktura repo na GitHubie: `context/foundation/`, `tests/`, `.github/workflows/`.
8. Zielony run GitHub Actions (joby `checks` i `e2e`).
9. Supabase: tabele z włączonym RLS (Table Editor) albo `audits/mvp-check-2026-09-07.md`.

Screenshoty wgraj bezpośrednio do formularza; kopię trzymaj w
`deployment/screenshots/` (PNG, do 500 KB każdy, commitowane).

## Checklista wysyłki

- [ ] Ostatni commit na `main` ma zielone CI.
- [ ] `npx wrangler deployments list` pokazuje aktualną wersję; smoke z runbooka.
- [ ] Baza produkcyjna bez kont testowych: każdy run CI zakłada konta, więc
      sprzątanie (H-10) jest ostatnim krokiem po ostatnim pushu; commity samej
      dokumentacji oznaczaj `[skip ci]`.
- [ ] Repo publiczne (sprawdzone 2026-09-07).
- [ ] Formularz: linki, opis, komentarz, screenshoty; jedno zgłoszenie,
      zakres: tylko Builder.
