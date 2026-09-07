# AGENTS.md - app-10xcards

## Projekt

- **Nazwa:** app-10xcards
- **Archetyp:** software
- **Cel jednym zdaniem:** własna wersja 10xCards (projekt zaliczeniowy kursu
  10xDevs 3.0, blok 10xBuilder): zalogowany użytkownik wkleja tekst, AI proponuje
  fiszki, użytkownik każdą jawnie akceptuje, edytuje albo odrzuca, a zaakceptowane
  trafiają do jego decka.
- **Efekt końcowy:** aplikacja webowa pod publicznym URL z logowaniem, pełnym
  CRUD-em fiszek, bramką akceptacji jako logiką domenową, jednym testem e2e
  mapowanym na ryzyko z `test-plan.md` i kompletem dokumentów w
  `context/foundation/`; zgłoszona do certyfikacji przed 14.09.2026.

## Powiązania

- `project-structure`: twarda; szkielet i szablony stamtąd; odstępstwa O1-O2
  niżej zapisane też w `relations.md` tamtego repo.
- `course-10xdevs3`: miękka (wspólna dziedzina); baza wiedzy kursu jest źródłem
  wymagań (10xCards, roadmapa m2l1, mvp-check). Przy zmianie wymagań
  certyfikacji tam, sprawdź `shape-notes.md` i `prd.md` tutaj.
- `projects-metrics-exporter`: miękka; publikujemy `metrics/project_metrics.prom`,
  repo dodane do configu exportera.

## Odstępstwa od meta-struktury (odbiegamy, bo X)

- **O1: dokumenty fundamentu w `context/foundation/`, nie w `requirements/`,
  `decisions/`, `plans/`.** Bo narzędzie certyfikacyjne kursu (mvp-check) i
  sprawdzający szukają `context/foundation/{shape-notes,prd,tech-stack,
  infrastructure,roadmap,test-plan}.md` w pierwszej kolejności. Katalogu
  `requirements/` nie ma; `decisions/` trzyma wyłącznie ADR-y; `plans/` trzyma
  plany `NNNN-<slug>/`. Warunek powrotu: po uzyskaniu certyfikatu, jeśli projekt
  żyje dalej.
- **O2: CI na GitHub Actions obok Forgejo Actions.** Bo sprawdzający patrzą na
  GitHub (publiczny mirror), a bramki muszą być tam widoczne. Forgejo pozostaje
  origin.

## Zasada nr 1: najpierw przeczytaj

1. `PROJECT_STATUS.md` - gdzie jesteśmy i jaki jest następny krok,
2. `context/foundation/prd.md` - co budujemy i czego świadomie NIE budujemy,
3. `context/foundation/roadmap.md` - kolejność slice'ów; aktywny plan w
   `plans/NNNN-<slug>/plan.md` (który - wskazuje PROJECT_STATUS),
4. `context/foundation/tech-stack.md` i `infrastructure.md` - czym i gdzie,
5. `lessons/` - nie powtarzaj opisanych tam błędów.

## Mapa repo

```
context/foundation/   # shape-notes, prd, tech-stack, infrastructure, roadmap, test-plan
context/inspiration/  # materiały referencyjne + sources.md
decisions/            # adr-NNNN-<slug>.md (rejestr w README)
plans/                # NNNN-<slug>/ (plan.md, research.md, review.md) + archived/
deployment/           # deploy-plan.md, konfiguracja wdrożenia
prompts/ human/       # prompty sesji YYYY-MM-DD-<slug>.md; zadania człowieka `- [ ] **H-N**`
lessons/ audits/ metrics/ runbooks/ tools/   # lekcje, audyty, project_metrics.prom, runbooki, status-block.py
src/ tests/ supabase/ # kod aplikacji (Astro), testy (Vitest, Playwright), migracje Supabase
```

## Workflow

**Poziomy zmian:**
- **Poziom 1 (trywialna):** wykonaj i opisz w commicie.
- **Poziom 2 (średnia):** krótki plan w rozmowie → wykonaj → zaktualizuj
  następny krok i wątki otwarte w `PROJECT_STATUS.md` (poza blokiem generowanym).
- **Poziom 3 (duża/ryzykowna):** `plans/NNNN-<slug>/plan.md` → **STOP, akceptacja
  człowieka** → wykonuj faza po fazie. Każdy slice roadmapy to poziom 3.

**Pętla wykonania (poziom 3):**
1. (opcjonalnie) `research.md` - każde ustalenie z referencją `file:line`,
2. `plan.md` - end state, fazy, success criteria, `## Progress`,
3. implementacja faza po fazie: po każdej fazie commit + odhacz `## Progress`,
4. mały rozjazd - adaptuj; zmiana end state lub kontraktu - wróć do planu i człowieka,
5. przed merge: review (`plans/NNNN-<slug>/review.md`, scorecard), sesją
   drugiego dostawcy (Codex), gdy czas pozwala,
6. koniec: sekcja "Wynik" w plan.md → przenieś plan do `plans/archived/`.

**Po każdym domkniętym kroku, w tym samym commicie:**
- odhacz fazę w `## Progress` swojego planu; to jedyne miejsce, w którym
  zapisujesz postęp,
- **bloku między `<!-- generated:begin -->` a `<!-- generated:end -->`
  w `PROJECT_STATUS.md` nie piszesz ręcznie nigdy**; regenerujesz go komendą
  `python3 tools/status-block.py --write`. Poza blokiem aktualizujesz następny
  krok, wątki otwarte i dziennik,
- `metrics/project_metrics.prom` wypełniasz **wynikiem komendy**, nie deklaracją,
- sprawdź rozmiar statusu (reguła w `PROJECT_STATUS.md`).

## Gdzie zapisywać wyniki

- Decyzja trwała → `decisions/adr-NNNN-<slug>.md`; decyzje o stacku i
  infrastrukturze → odpowiedni plik w `context/foundation/`.
- Procedura, która pierwszy raz zadziałała naprawdę → `runbooks/<kebab-case>.md` + wiersz w README.
- Lekcja → `lessons/YYYY-MM-DD-<slug>.md` (jeden plik = jedna lekcja).
- Materiał referencyjny → `context/inspiration/` + wpis w `sources.md`.
- Brudnopis → `scratchpad/` (nie commituj). **Nigdy luzem w root repo.**

## Twarde zasady

- Sekrety poza repo: `.env` jest w `.gitignore`; klucze Supabase (anon),
  OpenRouter i Cloudflare tylko w `.env` lokalnie i w secret managerze
  platformy. Nigdy klucz `service_role` w kodzie aplikacji.
- Nazwy plików, katalogów, commitów po angielsku; treść dokumentów po polsku;
  UI aplikacji po polsku.
- Commity: Conventional Commits (bramka `commit-msg` w `lefthook.yml`);
  commit po fazie planu; zawsze z pathspecem (`git commit -- <paths>`).
- Akcje destruktywne/nieodwracalne (reset bazy, usunięcie projektu Supabase,
  rotacja sekretów) wyłącznie po jawnej zgodzie człowieka.
- Nie edytuj `src/components/ui/**` ręcznie, jeśli pochodzi z generatora
  (shadcn); nie edytuj wygenerowanych typów Supabase - regeneruj komendą.
- Własność danych egzekwują polityki RLS w Supabase; każdy endpoint API
  i tak sprawdza użytkownika z sesji. Test IDOR (US-009) jest obowiązkowy
  przed oddaniem.
- Dostawca AI za adapterem z interfejsem `generateCandidates(text)`;
  w testach e2e i unit używany jest deterministyczny mock, nie sieć.
- Zakres jest zamrożony na `prd.md`: pomysł spoza non-goals trafia do
  `roadmap.md` sekcja Parked, nie do kodu.
