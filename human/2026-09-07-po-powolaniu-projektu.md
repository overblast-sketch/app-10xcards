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
- [x] **H-2** Wygeneruj klucz OpenRouter z limitem wydatków (np. 5 USD) i zapisz
      jako `OPENROUTER_API_KEY` w `.env`.
      Dlaczego nie agent: sekret.
  (zrobione 2026-09-07: klucz w `.env`, autoryzacja potwierdzona przez API)
- [x] **H-3** Załóż konto Cloudflare (Workers, plan free) i przygotuj
      `CLOUDFLARE_API_TOKEN` z uprawnieniem do Workers, jeśli deploy ma iść z CI;
      do pierwszego deployu ręcznego wystarczy `npx wrangler login`.
      Dlaczego nie agent: sekret i logowanie w przeglądarce.
  (zrobione 2026-09-07: konto, subdomena `tomasz-sinkiewicz.workers.dev`,
  `wrangler login` w Terminalu; token API niepotrzebny do deployu ręcznego)
- [x] **H-4** Repo na GitHub `overblast-sketch/app-10xcards` jako `origin`
      (zrobione 2026-09-07: decyzja Tomasza, GitHub zamiast Forgejo; odstępstwo O2
      w `AGENTS.md`). Repo jest dziś **prywatne**: przed zgłoszeniem albo zmień na
      publiczne, albo dodaj współpracowników `przeprogramowani`, `psmyrdek`,
      `mkczarkowski` (wymóg kursu dla repo prywatnych).
- [x] **H-5** Otwórz na platformie kursu prework 4.2 „Dobry i zły projekt
      kursowy" i wklej agentowi oficjalny PRD 10xCards (albo podłącz rozszerzenie
      Chrome), żeby porównać z `context/foundation/prd.md`.
      Dlaczego nie agent: treść za logowaniem na platformie.
  (zrobione 2026-09-07: Tomasz wkleił treść lekcji. Nie ma tam pełnego PRD,
  tylko opis MVP fiszek i sześć wymagań certyfikacji; porównanie w
  `context/foundation/prd.md` §Open questions i w PROJECT_STATUS)
- [x] **H-7** Repo zdalne i push (zrobione 2026-09-07: origin to GitHub,
      Forgejo pominięte decyzją Tomasza).
- [ ] **H-6** (opcjonalne, po certyfikacji) mirror GitHub → Forgejo i wpis
      w configu exportera metryk na N100, jeśli projekt ma być liczony we flocie.
      Dlaczego nie agent: zmiana konfiguracji na hoście produkcyjnym.
- [x] **H-8** Otwórz https://app-10xcards.tomasz-sinkiewicz.workers.dev z telefonu
  (sieć komórkowa, nie Wi-Fi domowe) w Chrome i Safari: czy jest czerwone
  ostrzeżenie Safe Browsing, czy logowanie i generacja działają. Wynik wpisz
  tutaj. Przy ostrzeżeniu: skill `safe-browsing` (procedura odwołania).
  Dlaczego nie agent: inna sieć i przeglądarki mobilne.
  (zrobione 2026-09-07 przez Tomasza: sprawdzone, bez zgłoszonego ostrzeżenia)
- [x] **H-9** Zmień widoczność repo GitHub na publiczne (decyzja Tomasza
  2026-09-07). Agent nie może: lokalna bramka niebezpiecznych komend
  (`~/.agents/hooks/dangerous-patterns.txt`) blokuje zmianę widoczności przez
  `gh`. Zrób sam: GitHub → repo → Settings → Danger Zone → Change visibility
  → Make public, albo ta sama komenda `gh repo edit ... --visibility ...`
  wpisana przez Ciebie w Terminalu.
  (zrobione 2026-09-07 przez Tomasza; `gh repo view` → PUBLIC, README
  pobieralny bez logowania)
- [x] **H-10** Sprzątanie kont testowych w Supabase Auth (zrobione 2026-09-07
  za zgodą Tomasza: usunięto 69 kont z prefiksami e2e-, smoke-, idor-,
  atomic-, probe- w domenie example.com; kaskadowo generacje, kandydaci
  i fiszki; wszystkie tabele puste, żadnego innego użytkownika nie było).
