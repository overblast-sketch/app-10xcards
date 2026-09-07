# Infrastructure - app-10xcards

<!-- Trzeci kontrakt: GDZIE I JAK DZIAŁA. Powstaje z tech-stack.md.
     Szablon: project-structure/templates/infrastructure.md. Przepuszczone przez
     devil's advocate, pre-mortem i unknown unknowns (sekcja Ryzyka). -->

## Wybór platformy

**Cloudflare Workers** (plan free) dla aplikacji Astro SSR + **Supabase**
(hostowany, plan free, region EU) dla auth i bazy + **OpenRouter** dla AI.
Uzasadnienie: starter kursu ma gotowy adapter i `wrangler.jsonc`, deploy to
jedna komenda, logi i rollback z CLI, zero serwerów do utrzymania w tygodniu
bez zapasu czasu. Alternatywy: Vercel (równie proste, ale starter jest pod
Cloudflare); własny homelab N100 (publiczny URL wymagałby tunelu i domeny,
prowadzący dostaliby adres w cudzej sieci); DigitalOcean App Platform
(kurs go pokazuje, ale płatny i wolniejszy w konfiguracji).

## Dopasowanie do stacku

- Astro `output: "server"` + `@astrojs/cloudflare`: każda strona i trasa API
  to request do Workera; statyczne assety z `dist/` przez binding `ASSETS`.
- Runtime workerd, nie Node: `nodejs_compat` włączony; biblioteki muszą
  działać na Web API (`fetch`, brak `fs`). supabase-js i wywołanie
  OpenRouter przez `fetch` spełniają to.
- Limit czasu: Worker na planie free ma limit CPU 10 ms na request, ale
  czas oczekiwania na `fetch` (OpenRouter, Supabase) nie liczy się do CPU.
  Generacja trwa kilka do kilkunastu sekund oczekiwania na sieć, więc mieści
  się; parsowanie odpowiedzi jest tanie.
- Stan wyłącznie w Supabase; Worker jest bezstanowy.

## Praca agenta z platformą

- Deploy: `npx wrangler deploy` (po `npm run build`), z Maca po `npx wrangler
  login` (H-3). Podgląd wdrożeń: `npx wrangler deployments list`.
- Logi na żywo: `npx wrangler tail`. Dashboard Cloudflare tylko do sekretów
  i obserwowalności.
- Supabase: `npx supabase db push` (migracje na projekt hostowany po
  `npx supabase link --project-ref <ref>`), `npx supabase gen types
  typescript --linked > src/db/types.ts`. Lokalnie `npx supabase start`
  (Docker) na czas e2e.
- CI (GitHub Actions): lint, check, unit, build na każdy push i PR do
  `main`. Deploy z CI (job `deploy` na push do `main` z `CLOUDFLARE_API_TOKEN`)
  dopiero po pierwszym ręcznym deployu, który potwierdzi konfigurację.

## Sekrety

| Sekret | Gdzie żyje | Zakres |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_KEY` (anon) | `.env` lokalnie, `.dev.vars` dla wrangler dev, `wrangler secret put` w Cloudflare, secrets repo w GitHub (do builda w CI) | klucz anon: publiczny z natury, RLS jest granicą; **nigdy `service_role`** w aplikacji |
| `OPENROUTER_API_KEY` | `.env` / `.dev.vars` / `wrangler secret put` | klucz z limitem wydatków ustawionym w OpenRouter (H-2) |
| `AI_PROVIDER`, `OPENROUTER_MODEL` | zwykłe zmienne (nie sekrety) w `wrangler.jsonc` `vars` i `.env` | konfiguracja |
| `CLOUDFLARE_API_TOKEN` | wyłącznie GitHub secrets, gdy włączymy deploy z CI | Workers Scripts: Edit, jedno konto |

`.env`, `.env.*` i `.dev.vars` są w `.gitignore`; `.env.example` z kluczami
bez wartości jest w repo.

## Rollback

1. `npx wrangler deployments list` i `npx wrangler rollback <deployment-id>`
   (przywraca poprzednią wersję Workera w sekundy).
2. Migracje bazy nie mają automatycznego rollbacku: każda migracja, która
   zmienia istniejące tabele, dostaje plik `*_down.sql` w `supabase/migrations/`
   uruchamiany ręcznie; dla MVP migracje są wyłącznie addytywne.
3. Sekret zepsuty: `wrangler secret put` ponownie, bez redeployu kodu.

## Uprawnienia i granice

Agent może: budować, deployować przez wrangler z sesji na Macu, pushować
migracje na projekt Supabase **po akceptacji planu slice'a**, czytać logi.

Wyłącznie po jawnej zgodzie człowieka: `supabase db reset` na projekcie
hostowanym, usunięcie projektu Supabase lub Workera, rotacja sekretów,
zmiana ustawień Auth (email confirmation, dostawcy), zmiana widoczności
repo GitHub, dodanie współpracowników.

## Ryzyka

| Ryzyko | Sygnał wczesny | Mitygacja |
|---|---|---|
| Ekran logowania na świeżej domenie `*.workers.dev` trafia pod Google Safe Browsing ("witryna wprowadzająca w błąd"), prowadzący widzą czerwony ekran | ostrzeżenie w Chrome przy pierwszym wejściu po deployu | deploy wcześnie (F-02), sprawdzenie w Chrome, Safari i Firefoksie z innej sieci; skill `safe-browsing` przed oddaniem; landing z jasnym opisem, nie sam formularz hasła |
| Supabase free pausuje projekt po 7 dniach bez ruchu; sprawdzający wchodzą po pauzie | mail z Supabase o pauzie | sprawdzać projekt co 2 dni do końca okna oceny; ping w kalendarzu H-N po oddaniu |
| OpenRouter: timeouty albo model zwraca nie-JSON | błędy 5xx w `wrangler tail`, pusta lista kandydatów | JSON-mode + walidacja zod + jedna próba ponowienia; komunikat i zachowany tekst (FR-007) |
| Limit 10 ms CPU Workera przekroczony przy dużym tekście (parsowanie 10 000 znaków i odpowiedzi) | błąd "CPU time limit exceeded" w logach | zmierzyć na 10 000 znaków przed oddaniem; awaryjnie limit tekstu w dół albo plan paid (5 USD) |
| Klucz `service_role` przypadkiem w kliencie | grep w pre-commit na `service_role` | bramka pre-commit + `.env.example` tylko z anon |
| Email confirmation włączone na hostowanym Supabase blokuje rejestrację w e2e | rejestracja kończy się "sprawdź skrzynkę" | D8: wyłączyć w ustawieniach Auth projektu (H-1), test e2e loguje istniejącego użytkownika testowego |
| Cold start Workera + pierwsze zapytanie do Supabase powyżej kilku sekund | wolne pierwsze wejście | akceptowalne dla MVP; nie optymalizujemy |

Pre-mortem "deploy padł dzień przed terminem": najbardziej prawdopodobne to
brak sekretu na Cloudflare (aplikacja renderuje "brak konfiguracji", starter
ma na to `config-status.ts`) albo migracja niewypchnięta na projekt
hostowany (RLS odrzuca zapisy). Oba wykrywa ręczna checklista wdrożenia
w `deployment/deploy-plan.md`, wykonywana przy F-02 i powtarzana przed
oddaniem.

## Warunki rewizji

- Koszt: przekroczenie planu free Cloudflare (100 000 requestów dziennie)
  albo Supabase (500 MB bazy) - nierealne w skali projektu.
- Limit CPU Workera blokuje generację na pełnym tekście - przejście na
  plan paid Workers albo przeniesienie generacji do Supabase Edge Function.
- Konieczność wysyłania maili (potwierdzenia, reset hasła) - dodać SMTP
  do Supabase Auth i włączyć confirmation.
