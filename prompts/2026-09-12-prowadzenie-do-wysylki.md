---
status: todo
created: 2026-09-12
model: sonnet
blocked-by: []
after: be534a9f801dfa40f8b64d870308000f003efa54
---

# Sesja prowadząca: od hasła do wysłanego formularza (do 2026-09-14 23:59)

Rola: przewodnik. Tomasz klika w przeglądarce, Ty prowadzisz krok po kroku,
weryfikujesz komendami i robisz to, co da się zrobić z sesji. Instrukcja
kliknięć jest gotowa: `human/2026-09-12-instrukcja-wysylki.md` (H-0 hasło,
H-16, H-11, H-12, H-13, H-14, H-15, H-17). Kontekst: `PROJECT_STATUS.md`,
`human/2026-09-07-przed-oddaniem.md` (pozycje H-11..H-17 do odhaczania),
`deployment/submission.md` (teksty do formularza).

## Jak prowadzić

1. Na start zmierz stan i pokaż go w jednej linii: status projektu Supabase
   (`npx supabase projects list`, po `source ~/.nvm/nvm.sh && nvm use 22`
   w katalogu repo), HTTP landingu (`curl -s -o /dev/null -w '%{http_code}'`),
   liczba kont prawdziwych i testowych (`npx supabase db query --linked` z SQL
   liczącym `email ~ '^(e2e-|smoke-|idor-|atomic-|probe-|injection-).*@example\.com$'`),
   widoczność repo (`gh api repos/overblast-sketch/app-10xcards --jq .visibility`).
2. Prowadź w kolejności z sekcji "Kolejność na dziś" w instrukcji. Jeden krok
   na wiadomość: co kliknąć, czego się spodziewać, po czym poznać sukces.
   Nie wklejaj całej instrukcji naraz.
3. Zapytaj najpierw, czy Tomasz pamięta hasło do konta w aplikacji. Jeśli nie:
   H-0. Usunięcie jego konta wykonujesz tylko na wyraźne polecenie z adresem.
4. Kroki, które robisz sam, na słowo Tomasza:
   - "posprzątaj konta testowe" → SQL `delete from auth.users where email ~ ...`
     (wzorce jak wyżej), pokaż liczbę usuniętych i listę pozostałych adresów
     (mają zostać tylko prawdziwe). Nieodwracalne: bez słowa nie ruszaj.
   - "wypisz opis" / "wypisz komentarz" → wypisz odpowiednie sekcje
     `deployment/submission.md` w bloku do skopiowania, bez zmian.
   - "sprawdź przed wysyłką" → `gh api ... --jq .visibility` = public,
     `curl` landingu = 200, `git status` czyste, `gh run list --limit 1` = success.
   - "wysłane YYYY-MM-DD" → odhacz H-13 i H-14 w `human/2026-09-07-przed-oddaniem.md`
     (dopisek `(zrobione YYYY-MM-DD)`), milestone `submitted` w
     `context/foundation/roadmap.md` na ✅ z datą, wpis w dzienniku
     `PROJECT_STATUS.md`; commit z pathspecem i `[skip ci]` w tytule, push.
5. Twarde zakazy: nie uruchamiaj `npm test`, `npm run test:e2e` ani deployu
   (zakładają konta testowe, zmieniają produkcję); nie pushuj kodu; nie
   obsługuj haseł (Tomasz wpisuje je sam); komendy blokowane przez lokalną
   bramkę zgłaszasz człowiekowi, nie obchodzisz.
6. Na koniec: `/next` albo krótkie podsumowanie, co odhaczone i co zostaje
   (H-15, H-16 cyklicznie, H-17 do 30.09).

## Rekomendacja modelu

`sonnet`: to prowadzenie po gotowej instrukcji i kilka komend weryfikujących;
nie ma decyzji projektowych. `opus` tylko, gdy po drodze wyjdzie awaria
(pauza Supabase, błąd aplikacji) wymagająca diagnozy.

## Równoległość

- Werdykt: brak (sesja interaktywna, człowiek wykonuje kroki sekwencyjnie
  w przeglądarce; nie ma nic do zrównoleglenia).
- Mechanizm: nie dotyczy.

Wszystko powyżej to kontekst do zweryfikowania w repo i komendami, nie fakt
do przyjęcia na wiarę.
