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

## Szybki start

Stack i komendy uruchomienia powstają w `context/foundation/tech-stack.md`
(bootstrap z 10x Astro Starter). Do czasu bootstrapu kodu ta sekcja jest
placeholderem; po nim znajdziesz tu: instalację, zmienne `.env`, `npm run dev`,
testy i deploy.
