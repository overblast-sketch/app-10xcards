# app-10xcards

Własna wersja **10xCards**: aplikacja do fiszek, w której AI generuje kandydatów
z wklejonego tekstu, a użytkownik każdą fiszkę jawnie akceptuje, poprawia albo
odrzuca, zanim trafi do jego decka. Projekt zaliczeniowy kursu 10xDevs 3.0
(blok 10xBuilder), budowany w całości workflow "dokument → plan → kod → test"
z agentem AI.

- Archetyp: software (struktura wg repo `project-structure`, odstępstwa w `AGENTS.md`)
- Status i następny krok: `PROJECT_STATUS.md`
- Dokumenty kontekstowe: `context/foundation/` (shape-notes, prd, tech-stack,
  infrastructure, roadmap, test-plan)
- Konwencja pracy agenta: `AGENTS.md`

## Co robi aplikacja

1. Rejestracja i logowanie (email + hasło); ekrany produktu tylko dla zalogowanych.
2. Wklejasz tekst (1 000 - 10 000 znaków), AI proponuje fiszki (przód / tył).
3. Każdego kandydata akceptujesz, edytujesz i akceptujesz, albo odrzucasz.
4. "Zapisz do decka" zapisuje atomowo wyłącznie zaakceptowane fiszki.
5. Deck: lista, edycja i usuwanie własnych fiszek. Każda generacja zapisuje
   statystykę akceptacji.

## Stack

Astro 6 (SSR) + React 19 + TypeScript + Tailwind 4 + shadcn/ui, Supabase
(auth email+hasło, Postgres z RLS), OpenRouter za adapterem z mockiem do
testów, Cloudflare Workers. Bazą jest `10x-astro-starter` z kursu.
Szczegóły i decyzje: `context/foundation/tech-stack.md`.

## Szybki start

```bash
nvm use                      # Node 22 (.nvmrc)
npm install                  # instaluje też hooki husky
cp .env.example .env         # SUPABASE_URL, SUPABASE_KEY (anon), OPENROUTER_API_KEY, AI_PROVIDER
npm run dev                  # http://localhost:4321
```

Bez skonfigurowanego Supabase aplikacja startuje, ale logowanie jest
wyłączone (baner na stronie). Schemat bazy: `supabase/migrations/`, wypychany
na projekt hostowany przez `npx supabase link` i `npx supabase db push`.

## Bramki i testy

```bash
npm run lint                 # ESLint (type-checked) + Prettier
npm run check                # astro check
npm test                     # Vitest: tests/unit, tests/integration
npm run test:e2e             # Playwright: tests/e2e (AI_PROVIDER=mock)
npm run build                # build produkcyjny (Cloudflare)
```

Testy integracyjne (`tests/integration/`) i e2e wymagające sesji idą na
hostowany projekt Supabase i **pomijają się bez `SUPABASE_URL` i `SUPABASE_KEY`**
w `.env` (lokalnie) albo w sekretach repo (CI); bez nich zielony wynik oznacza
tylko testy unit. Te same komendy uruchamia CI (`.github/workflows/ci.yml`) na
każdy push i PR do `main`. Hooki: pre-commit (lint-staged + grep sekretów), pre-push (`npm test`).
Mapa ryzyk i mapowanie testów na ryzyka: `context/foundation/test-plan.md`.

## Deploy

Aplikacja działa publicznie pod **https://app-10xcards.tomasz-sinkiewicz.workers.dev**
(Cloudflare Workers, Supabase EU, OpenRouter `google/gemini-2.5-flash-lite`).

```bash
npm run build && npx wrangler deploy     # deploy z Maca, po `npx wrangler login`
npx wrangler secret put <NAZWA>          # SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY
```

Procedura, weryfikacja i rollback: `runbooks/deploy-cloudflare.md`; checklista
wdrożenia: `deployment/deploy-plan.md`; decyzje i ryzyka:
`context/foundation/infrastructure.md`.
