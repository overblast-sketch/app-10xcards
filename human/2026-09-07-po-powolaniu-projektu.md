# Po powołaniu projektu (2026-09-07)

Zadania człowieka przed sesją bootstrapu kodu. Żadne nie blokuje pisania
`tech-stack.md`, `infrastructure.md`, `roadmap.md` i `test-plan.md`; wszystkie
blokują pierwszy deploy i pierwszą prawdziwą generację.

- [ ] **H-1** Załóż projekt Supabase (region EU) i zapisz w `.env` lokalnie
  `SUPABASE_URL` oraz `SUPABASE_KEY` (klucz anon, nie service_role).
  Dlaczego nie agent: zakładanie kont i wpisywanie sekretów jest poza
  uprawnieniami agenta.
- [ ] **H-2** Wygeneruj klucz OpenRouter z limitem wydatków (np. 5 USD) i zapisz
  jako `OPENROUTER_API_KEY` w `.env`.
  Dlaczego nie agent: sekret.
- [ ] **H-3** Załóż konto Cloudflare (Workers, plan free) i przygotuj
  `CLOUDFLARE_API_TOKEN` z uprawnieniem do Workers, jeśli deploy ma iść z CI;
  do pierwszego deployu ręcznego wystarczy `npx wrangler login`.
  Dlaczego nie agent: sekret i logowanie w przeglądarce.
- [ ] **H-4** Potwierdź publiczny mirror na GitHub `app-10xcards` (konto
  `overblast-sketch`) i włącz push mirror z Forgejo, tak jak w innych
  projektach (`human/2026-09-05-po-konfiguracji-mirror-github.md`
  w `project-structure`).
  Dlaczego nie agent: publikacja publiczna wymaga jawnej zgody.
- [ ] **H-5** Otwórz na platformie kursu prework 4.2 „Dobry i zły projekt
  kursowy" i wklej agentowi oficjalny PRD 10xCards (albo podłącz rozszerzenie
  Chrome), żeby porównać z `context/foundation/prd.md`.
  Dlaczego nie agent: treść za logowaniem na platformie.
- [ ] **H-7** Załóż puste repo `tom/app-10xcards` na Forgejo (bez README,
  gałąź `main`) i wypchnij: `git push -u origin main` (remote już dodany).
  Alternatywa: zezwól agentowi na wywołanie API Forgejo z tokenem z
  `~/.config/agent-terminal/.env` (klasyfikator uprawnień zablokował je dwa razy).
  Dlaczego nie agent: blokada uprawnień na użycie tokenu w tej sesji.
- [ ] **H-6** Dodaj `app-10xcards` do configu exportera metryk na N100
  (`projects-metrics-exporter`, runbook tam), gdy będzie wygodnie; nie jest
  potrzebne do certyfikacji.
  Dlaczego nie agent: zmiana konfiguracji na hoście produkcyjnym.
