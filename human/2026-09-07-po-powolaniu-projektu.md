# Po powołaniu projektu (2026-09-07)

Zadania człowieka przed sesją bootstrapu kodu. Żadne nie blokuje pisania
`tech-stack.md`, `infrastructure.md`, `roadmap.md` i `test-plan.md`; wszystkie
blokują pierwszy deploy i pierwszą prawdziwą generację.

- [x] **H-1** Załóż projekt Supabase (region EU) i zapisz w `.env` lokalnie
      `SUPABASE_URL` oraz `SUPABASE_KEY` (klucz anon, nie service_role).
      Dlaczego nie agent: zakładanie kont i wpisywanie sekretów jest poza
      uprawnieniami agenta.
      (zrobione 2026-09-07: projekt `pmexsftaconiyztrvjuu`, eu-west-1, klucz
      publishable w `.env`, Confirm email wyłączone, CLI zalogowane i zlinkowane,
      migracja wypchnięta, e2e rejestracji i logowania zielone)
- [ ] **H-2** Wygeneruj klucz OpenRouter z limitem wydatków (np. 5 USD) i zapisz
      jako `OPENROUTER_API_KEY` w `.env`.
      Dlaczego nie agent: sekret.
- [ ] **H-3** Załóż konto Cloudflare (Workers, plan free) i przygotuj
      `CLOUDFLARE_API_TOKEN` z uprawnieniem do Workers, jeśli deploy ma iść z CI;
      do pierwszego deployu ręcznego wystarczy `npx wrangler login`.
      Dlaczego nie agent: sekret i logowanie w przeglądarce.
- [x] **H-4** Repo na GitHub `overblast-sketch/app-10xcards` jako `origin`
      (zrobione 2026-09-07: decyzja Tomasza, GitHub zamiast Forgejo; odstępstwo O2
      w `AGENTS.md`). Repo jest dziś **prywatne**: przed zgłoszeniem albo zmień na
      publiczne, albo dodaj współpracowników `przeprogramowani`, `psmyrdek`,
      `mkczarkowski` (wymóg kursu dla repo prywatnych).
- [ ] **H-5** Otwórz na platformie kursu prework 4.2 „Dobry i zły projekt
      kursowy" i wklej agentowi oficjalny PRD 10xCards (albo podłącz rozszerzenie
      Chrome), żeby porównać z `context/foundation/prd.md`.
      Dlaczego nie agent: treść za logowaniem na platformie.
- [x] **H-7** Repo zdalne i push (zrobione 2026-09-07: origin to GitHub,
      Forgejo pominięte decyzją Tomasza).
- [ ] **H-6** (opcjonalne, po certyfikacji) mirror GitHub → Forgejo i wpis
      w configu exportera metryk na N100, jeśli projekt ma być liczony we flocie.
      Dlaczego nie agent: zmiana konfiguracji na hoście produkcyjnym.
