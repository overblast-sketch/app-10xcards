# Handoff przed oddaniem projektu (2026-09-07)

Kod, testy, dokumenty, review i produkcja są gotowe. Poniżej wszystko, co
zostaje po stronie człowieka, w kolejności wykonania. Materiały do formularza:
`deployment/submission.md`. Termin: **14 września 2026, 23:59** (ostatni).

## A. Przed wysyłką

- [ ] **H-11** Screenshoty (lista 9 pozycji w `deployment/submission.md`,
  sekcja „Screenshoty do zrobienia"). Zaloguj się na
  https://app-10xcards.tomasz-sinkiewicz.workers.dev własnym kontem (nie
  testowym), wklej fragment lekcji, przejdź całą pętlę, zrób zrzuty. Zapisz
  do `deployment/screenshots/` (PNG, do 500 KB) albo tylko do formularza.
  Dlaczego nie agent: przeglądarka i konto Tomasza.
- [ ] **H-12** Ostatnie sprzątanie bazy produkcyjnej **po ostatnim pushu**
  (każdy push uruchamia CI, które zakłada konta testowe). Komenda w katalogu
  projektu, po `source ~/.nvm/nvm.sh && nvm use 22`:
  ```
  npx supabase db query --linked "delete from auth.users where email ~ '^(e2e-|smoke-|idor-|atomic-|probe-|injection-).*@example\.com$'"
  ```
  Twoje własne konto (inny adres) zostaje. Weryfikacja:
  `npx supabase db query --linked "select email from auth.users"`.
  Alternatywa: poproś agenta („posprzątaj konta testowe").
- [ ] **H-13** Formularz zgłoszeniowy na platformie, jedno zgłoszenie,
  zakres **tylko 10xBuilder**:
  - link do repo: https://github.com/overblast-sketch/app-10xcards
  - publiczny URL: https://app-10xcards.tomasz-sinkiewicz.workers.dev
  - pole „Opis": sekcja „Opis projektu" z `deployment/submission.md`
  - pole „Twój komentarz": sekcja „Jak spełniam wymagania" z tego samego pliku
  - screenshoty z H-11.
  Dlaczego nie agent: formularz za logowaniem, decyzja o wysyłce jest Twoja.
- [ ] **H-14** Po wysłaniu: dopisz datę wysłania tutaj i w
  `PROJECT_STATUS.md` (milestone `submitted` w roadmapie na ✅).

## B. Po wysyłce, do 30 września 2026

- [ ] **H-15** Co 2-3 dni sprawdź wiadomości na platformie (feedback
  prowadzących przychodzi do 30.09; „cisza = dobrze"). Jeśli przyjdą uwagi:
  nowa sesja agenta w `app-10xcards`, zacznij od `PROJECT_STATUS.md`.
- [ ] **H-16** Utrzymuj projekt Supabase żywy: plan free pauzuje projekt po
  7 dniach bez ruchu. Wejdź na aplikację i wykonaj jedną generację co kilka
  dni do końca okna oceny (albo otwórz dashboard Supabase, to też liczy się
  jako aktywność). Sprawdzający mogą wejść nawet 30.09.
- [ ] **H-17** Nie pushuj zmian kodu w okresie oceny bez potrzeby. Jeśli
  musisz: po pushu powtórz H-12 (CI znów założy konta testowe). Commity samej
  dokumentacji oznaczaj `[skip ci]` w tytule.

## C. Opcjonalne, po certyfikacji

- [ ] **H-6** (z poprzedniego pliku) mirror GitHub → Forgejo i wpis w
  configu exportera metryk, jeśli projekt ma być liczony we flocie.
- [ ] Decyzja o dalszym rozwoju: S-03 (sesje powtórek SRS) jako nowa faza
  z aneksem do PRD, albo zamknięcie projektu zgodnie z warunkiem zakończenia
  w `context/foundation/shape-notes.md`.
- [ ] Migracja na Astro 7 (2 podatności high w `npm audit`, ryzyko przyjęte
  w planie 0901).
- [ ] Automatyczne sprzątanie kont testowych w CI (wymaga klucza
  `service_role` w sekretach GitHub) albo osobny projekt Supabase do testów.

## Stan na 2026-09-07 (dla porządku)

- Wersja produkcyjna Workera: `aa7517c9`; migracje: `initial_schema`,
  `gate_hardening`; baza po sprzątaniu pusta.
- CI: joby `checks` i `e2e` zielone; pada bez sekretów Supabase (celowo).
- mvp-check 5/5 (`audits/mvp-check-2026-09-07.md`), review Codex wdrożone
  (`audits/review-code-2026-09-07.md`), prompt injection odparte (test-plan).
