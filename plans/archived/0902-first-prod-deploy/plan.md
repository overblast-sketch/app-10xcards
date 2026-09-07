# Plan 0902 - first-prod-deploy

- **Pozycja roadmapy:** F-02 (numer katalogu z ID: `F-02` → `0902`)
- **Złożoność:** niska
- **Akceptacja:** 2026-09-07, Tomasz ("rób F-02")
- **Status:** zakończony 2026-09-07 (H-8 Safe Browsing otwarte, review do zrobienia)
- **Research:** nie był potrzebny; procedura wynika z `infrastructure.md`
  i README startera (`wrangler deploy`, `wrangler secret put`).

## End state

Aplikacja działa pod `https://app-10xcards.tomasz-sinkiewicz.workers.dev`
z prawdziwym Supabase i OpenRouter: rejestracja, logowanie, generacja,
bramka, zapis, deck. Sekrety siedzą w Cloudflare (nie w repo), zmienne
`AI_PROVIDER=openrouter` i `OPENROUTER_MODEL` w `wrangler.jsonc`. Procedura
wdrożenia i rollbacku jest spisana w `deployment/deploy-plan.md`
i `runbooks/deploy-cloudflare.md`, README ma sekcję Deploy z publicznym URL.

## Fazy

### Faza 1: konfiguracja Workera i pierwszy deploy
- **Intencja:** `wrangler.jsonc` z `vars` (AI_PROVIDER, OPENROUTER_MODEL),
  `npm run build`, `npx wrangler deploy`, potem `wrangler secret put` dla
  `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY` (wartości z `.env`,
  nigdy w repo). Sprawdzenie, że landing odpowiada 200 bez banera
  "Supabase nie jest skonfigurowany".
- **Zakres (pliki/obszary):**
  ```globs
  wrangler.jsonc
  deployment/**
  ```
- **Kontrakt:** nazwa Workera `app-10xcards`; sekrety wyłącznie przez
  `wrangler secret put`; `vars` w `wrangler.jsonc` nie zawierają sekretów.

### Faza 2: smoke na produkcji i pomiar limitu CPU
- **Intencja:** przez API produkcyjne (curl z nagłówkiem Origin): rejestracja
  użytkownika smoke, generacja na OpenRouter z tekstem 2,5 k i 10 k znaków
  (ryzyko limitu CPU z `infrastructure.md`), zapis, odczyt decka; log
  `wrangler tail` bez błędów; czasy zapisane w `## Wynik`.
- **Zakres (pliki/obszary):**
  ```globs
  deployment/**
  ```
- **Kontrakt:** brak zmian kodu; jeśli 10 k znaków przekracza limit CPU,
  decyzja wraca do człowieka (plan paid albo niższy limit tekstu w PRD).

### Faza 3: dokumentacja wdrożenia
- **Intencja:** `deployment/deploy-plan.md` (checklista wykonana, z datami),
  `runbooks/deploy-cloudflare.md` (procedura, która zadziałała: build, deploy,
  sekrety, tail, rollback), README sekcja Deploy z URL, roadmapa F-02 done.
- **Zakres (pliki/obszary):**
  ```globs
  deployment/**
  runbooks/**
  README.md
  context/foundation/roadmap.md
  ```
- **Kontrakt:** runbook opisuje wyłącznie kroki, które naprawdę zadziałały.

## Success criteria
- [x] `curl -s -o /dev/null -w '%{http_code}' https://app-10xcards.tomasz-sinkiewicz.workers.dev/` → 200
  i strona nie zawiera tekstu "Supabase nie jest skonfigurowany".
- [x] Rejestracja przez API produkcyjne → 302 na `/generate`; generacja
  z `AI_PROVIDER=openrouter` → 201 z kandydatami; zapis → 200.
- [x] Generacja z tekstem 10 000 znaków kończy się 201 (9 999 znaków, 11 kandydatów, 3,9 s) (bez "CPU time limit").
- [x] `npx wrangler deployments list` pokazuje wdrożenie; `wrangler secret list`
  pokazuje trzy sekrety.
- [ ] Tomasz otwiera URL w Chrome i Safari z telefonu (inna sieć): brak
  ostrzeżenia Safe Browsing, logowanie działa (H-8 w `human/`).

## Risks / open questions
- Safe Browsing na świeżej domenie `workers.dev` z ekranem hasła: sprawdzenie
  z innej sieci to zadanie człowieka (H-8); reakcja wg skilla `safe-browsing`.
- `astro:env` na Cloudflare czyta sekrety z bindingów runtime; jeśli po
  `secret put` baner nie znika, potrzebny redeploy (`wrangler deploy`).
- Użytkownik smoke na produkcji zostaje w `auth.users`; sprzątanie ręczne.

## Progress
- [x] Faza 1 - konfiguracja Workera i pierwszy deploy (commit: 5aecaf4)
- [x] Faza 2 - smoke na produkcji i pomiar limitu CPU (commit: f5679b8)
- [x] Faza 3 - dokumentacja wdrożenia (commit: 05dc9a9)
- [x] Review (review.md, werdykt: MERGE PO POPRAWKACH P1, wdrożone 2026-09-07)
      Wspólny review kodu F-01/S-01/S-02 drugim dostawcą (Codex gpt-5.5):
      `audits/review-code-2026-09-07.md`, tabela rozliczenia na końcu.

## Pomiar użycia
`npx wrangler deployments list` i liczba requestów w dashboardzie Cloudflare
(Workers → app-10xcards → Metrics), odczyt 2026-09-14; liczba użytkowników
w Supabase Auth bez prefiksów `e2e-`/`smoke-`.

## Wynik
Deploy dowieziony 2026-09-07, dwie wersje: `bdea2fae` (pierwsza) i `90586698`
(po poprawce). Publiczny URL działa z prawdziwym Supabase i OpenRouter.

- **Bug:** zmienne `astro:env` z `access: "public"` są wstrzykiwane w czasie
  builda z `.env`, więc produkcja użyła mocka mimo `vars` w `wrangler.jsonc`.
  Poprawka: wszystkie zmienne serwerowe jako `access: "secret"` (runtime).
  Lekcja w `lessons/`.
- **Pomiar limitu CPU:** 9 999 znaków → 201 w 3,9 s, 11 kandydatów; ryzyko
  z `infrastructure.md` nie zmaterializowało się na planie free.
- **Odstępstwa:** rollback nietestowany (poprzednia wersja ma znany błąd);
  auto-deploy z CI świadomie odłożony (D7). Safe Browsing do sprawdzenia
  przez Tomasza z innej sieci (H-8).
