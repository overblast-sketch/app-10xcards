# PRD - app-10xcards

<!-- Pierwszy kontrakt projektu: CO i DLA KOGO. Celowo BEZ tech stacku, planu testów
     i deploymentu (to tech-stack.md, infrastructure.md, test-plan.md w tym katalogu).
     Powstało z shape-notes.md. Szablon: project-structure/templates/prd.md -->

## Wizja i problem

Ręczne pisanie dobrych fiszek z przeczytanego tekstu zajmuje więcej czasu niż
samo czytanie, więc dorosły learner rezygnuje ze spaced repetition mimo
świadomości, że działa. 10xCards zamienia wklejony tekst w kandydatów na fiszki
proponowanych przez AI, a użytkownik zostaje bramką jakości: każdą fiszkę jawnie
akceptuje, poprawia albo odrzuca. Do decka trafiają tylko fiszki, którym ufa.

## Użytkownik / persona

**Dorosły learner** (konkretnie: autor projektu przerabiający materiały
techniczne po godzinach). Ma własne konto, widzi wyłącznie własne generacje
i fiszki. Jeden typ użytkownika, bez ról i bez administratora.

## Kryteria sukcesu

- Pełny przepływ "wklej tekst, generuj, oceń kandydatów, zapisz, zobacz w decku"
  działa od początku do końca na publicznym URL i przechodzi test e2e.
- Co najmniej 75% kandydatów wygenerowanych przez AI jest akceptowanych
  (mierzone z zapisanych statystyk generacji: zaakceptowane / wygenerowane).
- Projekt spełnia pięć kryteriów mvp-check (CRUD, logika biznesowa, test
  adresujący ryzyko z test-planu, auth powiązany z użytkownikiem, dokumentacja)
  i zostaje zgłoszony do certyfikacji 10xBuilder przed 14.09.2026.

## Wymagania funkcjonalne

Konta i dostęp:
- **FR-001:** Użytkownik może założyć konto podając email i hasło.
- **FR-002:** Użytkownik może zalogować się emailem i hasłem oraz wylogować.
- **FR-003:** Ekrany generowania i decka są dostępne wyłącznie po zalogowaniu;
  niezalogowany użytkownik jest przekierowany do logowania.
- **FR-004:** Użytkownik widzi i modyfikuje wyłącznie własne generacje
  i fiszki; próba dostępu do cudzego zasobu kończy się odmową, nie pustą listą
  z wyciekiem.

Generowanie:
- **FR-005:** Użytkownik może wkleić tekst źródłowy o długości od 1 000 do
  10 000 znaków; tekst poza zakresem jest odrzucany z czytelnym komunikatem
  przed wysłaniem do AI.
- **FR-006:** Po uruchomieniu generowania system tworzy zestaw kandydatów na
  fiszki (przód, tył) na podstawie tekstu; kandydaci są zapisywani jako
  propozycje powiązane z generacją, nie jako fiszki w decku.
- **FR-007:** Podczas generowania użytkownik widzi stan oczekiwania; błąd
  dostawcy AI lub przekroczenie czasu kończy się komunikatem i możliwością
  ponowienia, bez utraty wklejonego tekstu.

Bramka akceptacji:
- **FR-008:** Dla każdego kandydata użytkownik może wybrać: akceptuj, edytuj
  i akceptuj (zmiana przodu i/lub tyłu), odrzuć.
- **FR-009:** Użytkownik zapisuje do decka jednym działaniem wszystkich
  zaakceptowanych kandydatów z danej generacji; zapis jest atomowy.
- **FR-010:** Kandydaci odrzuceni i nierozstrzygnięci nie trafiają do decka.
- **FR-011:** Po zapisie użytkownik widzi zaakceptowane fiszki na liście decka
  oraz podsumowanie generacji (ile wygenerowano, ile zaakceptowano).
- **FR-012:** Każda generacja zapisuje statystykę: liczba wygenerowanych,
  zaakceptowanych bez zmian, zaakceptowanych po edycji, odrzuconych.

Deck (CRUD na fiszkach trwałych):
- **FR-013:** Użytkownik widzi listę swoich fiszek (przód, tył, data dodania),
  najnowsze na górze.
- **FR-014:** Użytkownik może edytować przód i tył zapisanej fiszki; zmiana
  jest trwała.
- **FR-015:** Użytkownik może usunąć zapisaną fiszkę po potwierdzeniu.
- **FR-016:** Przód fiszki ma 1-200 znaków, tył 1-500 znaków; walidacja przy
  edycji kandydata i przy edycji fiszki w decku.

## User stories

- **US-001** (FR-001, FR-002): Given nie mam konta, When rejestruję się
  emailem i hasłem i loguję, Then widzę pusty deck i wejście do generowania.
- **US-002** (FR-003): Given nie jestem zalogowany, When wchodzę na
  `/generate` lub `/deck`, Then trafiam na ekran logowania.
- **US-003** (FR-005, FR-006, FR-007): Given jestem zalogowany, When wklejam
  tekst o poprawnej długości i klikam "Generuj", Then po chwili widzę listę
  kandydatów z przodem i tyłem, każdy w stanie "nierozstrzygnięty".
- **US-004** (FR-005): Given wklejam 300 znaków, When klikam "Generuj", Then
  widzę komunikat o minimalnej długości i nic nie jest wysyłane do AI.
- **US-005** (FR-008, FR-009, FR-010, FR-011): Given mam 5 kandydatów, When
  akceptuję 2, edytuję i akceptuję 1, odrzucam 1, jednego zostawiam, i klikam
  "Zapisz do decka", Then w decku pojawiają się dokładnie 3 fiszki (w tym
  wersja po edycji), a odrzucony i nierozstrzygnięty nie.
- **US-006** (FR-009): Given zapis do decka nie powiódł się w połowie, When
  odświeżam deck, Then nie ma w nim żadnej fiszki z tej generacji (albo są
  wszystkie).
- **US-007** (FR-013, FR-014): Given mam fiszkę w decku, When zmieniam jej tył
  i zapisuję, Then po odświeżeniu widzę nowy tył.
- **US-008** (FR-015): Given mam fiszkę w decku, When ją usuwam i potwierdzam,
  Then znika z listy i nie wraca po odświeżeniu.
- **US-009** (FR-004): Given dwóch użytkowników A i B, When A próbuje
  odczytać lub zmienić fiszkę B po identyfikatorze, Then dostaje odmowę,
  a fiszka B pozostaje nietknięta.
- **US-010** (FR-012): Given zapisałem generację, When otwieram podsumowanie,
  Then widzę liczby: wygenerowane, zaakceptowane, po edycji, odrzucone.

## Logika biznesowa / reguły domenowe

1. **Bramka akceptacji.** Kandydat (`FlashcardCandidate`) ma stan
   `pending | accepted | edited | rejected`. Fiszka w decku (`Flashcard`)
   powstaje wyłącznie z kandydata w stanie `accepted` lub `edited`, w momencie
   zapisu generacji. Nigdy z `pending` ani `rejected`.
2. **Atomowość zapisu.** Zapis generacji tworzy wszystkie fiszki z
   zaakceptowanych kandydatów w jednej transakcji; błąd cofa całość.
   Generacja po zapisie jest zamknięta (nie można zapisać dwa razy).
3. **Generacja z tekstu.** Wejście 1 000 - 10 000 znaków; wynik to lista
   kandydatów z przodem (pytanie/pojęcie, do 200 znaków) i tyłem (odpowiedź,
   do 500 znaków). Kandydaci niespełniający limitów są przycinani albo
   odrzucani zanim trafią do użytkownika; pusta lista to błąd generacji.
4. **Własność.** Każda generacja, kandydat i fiszka należą do jednego
   użytkownika; reguła egzekwowana po stronie danych, nie tylko w UI.
5. **Statystyka generacji** liczona z decyzji użytkownika przy zapisie,
   nie edytowalna ręcznie.

## Model danych (zarys)

- **User** - tożsamość z systemu auth.
- **Generation** - `user`, tekst źródłowy (lub jego skrót i hash), model,
  `status: draft | saved | failed`, liczby: generated, accepted, edited,
  rejected, czas utworzenia i zapisu.
- **FlashcardCandidate** - `generation`, przód, tył, przód/tył po edycji,
  `state: pending | accepted | edited | rejected`.
- **Flashcard** - `user`, przód, tył, `source_generation` (opcjonalnie),
  czas utworzenia i modyfikacji.

Relacje: User 1-N Generation 1-N FlashcardCandidate; User 1-N Flashcard;
Flashcard N-1 Generation (opcjonalna).

## Kontrola dostępu

Jeden typ użytkownika. Każdy zasób ma właściciela; odczyt i zapis wyłącznie
przez właściciela, wymuszone na warstwie danych (polityki per wiersz) i w API.
Bez ról, bez administratora, bez zasobów publicznych.

## Non-goals

- Sesje powtórek i algorytm SRS (następny slice po certyfikacji).
- Ręczne tworzenie fiszek od zera (Create pokryte przez zapis kandydatów).
- Import PDF/DOCX/URL, współdzielenie decków, role, mobile/PWA/offline,
  usuwanie konta z retencją, statystyki nauki, gamifikacja.

Uzasadnienia w `shape-notes.md`.

## Open questions

Brak. Rozstrzygnięte 2026-09-07: lekcja preworku 4.2 „Dobry i zły projekt
kursowy" nie zawiera pełnego PRD 10xCards, tylko opis MVP („wklejam tekst,
aplikacja generuje propozycje fiszek, ja akceptuję wybrane i zapisuję je
w bazie") i sześć wymagań certyfikacji: kontrola dostępu, CRUD sensowny dla
domeny, logika biznesowa opisana jednym zdaniem, artefakty projektowe z modułów
1-3, test z perspektywy użytkownika, CI/CD (pipeline budujący i testujący).
Ten PRD pokrywa opis MVP wprost (FR-005..FR-011), a wymagania certyfikacji
są rozliczone w `audits/mvp-check-2026-09-07.md`; CI/CD: `.github/workflows/ci.yml`.
Logika biznesowa jednym zdaniem: **fiszka trafia do decka wyłącznie po jawnej
decyzji człowieka o kandydacie wygenerowanym przez AI, a zapis zaakceptowanych
jest atomowy.**
