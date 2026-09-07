---
starter_id: 10x-astro-starter
starter_commit: 69c0bfa (2026-08-22, "chore(welcome): update Astro version to 6")
bootstrapper_confidence: high
---

# Tech stack - app-10xcards

<!-- Drugi kontrakt projektu: Z CZEGO. Powstaje z prd.md. Szablon:
     project-structure/templates/tech-stack.md. Cztery bramki stacku
     agent-friendly: Typed / Convention-based / Popular / Well-documented. -->

## Stack

| Warstwa | Wybór | Wersja (ze startera) | Bramki (T/C/P/W) |
|---|---|---|---|
| Runtime | Node.js | 22.14.0 (`.nvmrc`) | ✅✅✅✅ |
| Framework | Astro, SSR (`output: "server"`), React 19 jako wyspy | Astro 6.3, React 19.2 | ✅✅✅✅ |
| Język | TypeScript strict | 5.9 | ✅✅✅✅ |
| UI | Tailwind CSS 4 + shadcn/ui (new-york) | Tailwind 4.2 | ✅✅✅✅ |
| Walidacja | zod (wejście API i formularzy) | najnowsza 3.x/4.x z npm | ✅✅✅✅ |
| Auth + baza | Supabase (Auth email+hasło, Postgres, RLS) przez `@supabase/ssr` | supabase-js 2.99, ssr 0.10 | ✅✅✅✅ |
| AI | OpenRouter (API zgodne z OpenAI, `fetch`, bez SDK) za własnym adapterem | - | ✅✅✅✅ |
| Hosting | Cloudflare Workers (`@astrojs/cloudflare` 13.5, wrangler 4.90) | - | ✅✅✅✅ |
| Testy unit/integration | Vitest | do dodania | ✅✅✅✅ |
| Testy e2e | Playwright (`@playwright/test`) | do dodania | ✅✅✅✅ |
| Lint / format | ESLint 9 (type-checked) + Prettier, husky + lint-staged | ze startera | ✅✅✅✅ |
| CI | GitHub Actions | - | ✅✅✅✅ |

## Why this stack

Ten zestaw jest stackiem dema kursowego dla 10xCards, więc prowadzący go
rozpoznają, a starter dostarcza już to, co w PRD jest fundamentem (F-01):
rejestrację, logowanie, wylogowanie, middleware chroniący trasy i klienta
Supabase z sesją w ciasteczkach. Supabase daje auth, Postgres i polityki RLS
bez własnego backendu, co przy tygodniu do terminu jest największą
oszczędnością. Alternatywy: Next.js + Supabase (znany, ale bez gotowego
startera kursu) i własny starter `ui-starter-web` (zakłada osobny backend
z OpenAPI, za dużo pracy dodatkowej). Odrzucone świadomie.

## Decyzje szczegółowe

- **D1: Starter klonujemy jako bazę repo, nie jako zależność.** `git clone`
  do katalogu tymczasowego, kopiujemy pliki do repo projektu (bez `.git`
  startera), pierwszy commit `chore: bootstrap from 10x-astro-starter@69c0bfa`.
  Warunek rewizji: nigdy; starter nie ma mechanizmu aktualizacji.
- **D2: Cała logika bramki akceptacji i zapisu żyje w `src/lib/services/`**
  jako czyste funkcje TypeScript (`decideCandidate`, `selectCardsToSave`,
  `validateSourceText`) niezależne od Astro i Supabase; trasy API tylko je
  wołają. Powód: testowalność unitowa reguły domenowej (ryzyko R1 w
  test-planie) bez bazy. Warunek rewizji: brak.
- **D3: Atomowy zapis generacji przez funkcję Postgres (RPC)**
  `save_generation(generation_id, decisions jsonb)` wykonywaną w jednej
  transakcji z `security invoker` i RLS, zamiast serii insertów z aplikacji.
  Powód: FR-009 (wszystkie albo żadna) nie da się zagwarantować z klienta
  supabase-js bez transakcji. Warunek rewizji: gdyby RPC utrudniało testy;
  wtedy Edge Function z tym samym kontraktem.
- **D4: Dostawca AI za interfejsem `AiProvider.generateCandidates(text)`**
  z dwiema implementacjami: `OpenRouterProvider` (HTTP, JSON-mode, timeout
  60 s, jedna próba ponowienia) i `MockProvider` (deterministyczne
  kandydaty z tekstu). Wybór przez zmienną `AI_PROVIDER=openrouter|mock`;
  testy e2e i CI zawsze na mocku. Model domyślny w `OPENROUTER_MODEL`
  (start: tani model klasy Flash/Mini, dokładne ID sprawdzić w OpenRouter
  przy implementacji, nie z pamięci). Warunek rewizji: koszt lub jakość
  generacji poniżej 75% akceptacji.
- **D5: Schemat bazy jako migracje Supabase** w `supabase/migrations/`
  (`generations`, `flashcard_candidates`, `flashcards`), każda tabela z RLS
  i politykami per operacja `auth.uid() = user_id`. Typy TypeScript
  generowane komendą `npx supabase gen types typescript` do `src/db/types.ts`,
  nie pisane ręcznie. Warunek rewizji: brak.
- **D6: Testy: Vitest dla usług i adapterów, Playwright dla jednego
  scenariusza e2e** (pełna pętla S-01 na mocku AI, prawdziwy Supabase
  lokalny lub dedykowany projekt testowy). Bez testów komponentów React.
  Powód: cost × signal i limit czasu. Warunek rewizji: bug w UI, którego
  e2e nie łapie.
- **D7: Bramki lokalne przez husky + lint-staged ze startera**, nie
  lefthook ze szkieletu floty (odstępstwo O3 w AGENTS.md); pre-push
  uruchamia `npm test`. CI GitHub Actions: lint, `astro check`, vitest,
  build; e2e w CI dopiero, gdy lokalny Supabase w runnerze zadziała
  (F-02, opcjonalne). Warunek rewizji: e2e w CI stabilne przez tydzień.
- **D8: Email confirmation w Supabase Auth wyłączone** dla MVP (jeden
  użytkownik-autor, brak SMTP). Warunek rewizji: otwarcie rejestracji dla
  obcych użytkowników.
- **D9: UI po polsku**, kod i identyfikatory po angielsku.

## Bootstrap

1. `git clone --depth 1 https://github.com/przeprogramowani/10x-astro-starter.git /tmp/starter`
   i skopiowanie zawartości (bez `.git`, bez `public/template.png`) do repo.
2. Usunięcie ze szkieletu floty: `lefthook.yml`, `.forgejo/` (D7, O2);
   `.github/workflows/ci.yml` startera dostosowany do gałęzi `main`.
3. `nvm use && npm install`, `cp .env.example .env` (wartości z H-1, H-2),
   `.dev.vars` dla `wrangler dev`.
4. `npx supabase init` już jest w starterze (`supabase/config.toml`);
   lokalnie `npx supabase start` (Docker) albo od razu projekt hostowany.
5. Weryfikacja po scaffoldzie: `npm run lint`, `npx astro check`,
   `npm run build`, `npm run dev` i rejestracja testowego użytkownika.
6. Dodanie Vitest i Playwright: `npm i -D vitest @playwright/test`,
   `npx playwright install chromium`, skrypty `test`, `test:e2e`.
