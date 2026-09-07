# Shape notes (problem statement) - app-10xcards

<!-- Wynik sesji "shape": zapis PODJĘTYCH DECYZJI, nie zapis rozmowy.
     Szablon i pytania sesji: project-structure/templates/problem.md.
     Plik nazywa się shape-notes.md, nie problem.md, bo tak szuka go
     narzędzie certyfikacyjne kursu (mvp-check) - patrz AGENTS.md, odstępstwo O1. -->

## Problem

Dorosły, samodzielnie uczący się człowiek czyta materiały (artykuły, rozdziały
dokumentacji, notatki z kursu) i wie, że najskuteczniejszą metodą utrwalenia jest
spaced repetition z fiszkami. Nie robi tego, bo ręczne pisanie dobrych fiszek
z przeczytanego tekstu zajmuje więcej czasu niż samo czytanie. Obejście dziś:
notatki w markdown, które nikt nie powtarza, albo fiszki pisane ręcznie w Anki
przez pierwsze dwa dni, po czym nawyk umiera.

Boli w konkretnym momencie: zaraz po lekturze, gdy materiał jest jeszcze świeży,
a użytkownik chce w kilka minut zamienić go w zestaw fiszek, którym ufa.

## Docelowy użytkownik

Jedna persona: **ja, Tomasz, w roli dorosłego learnera**, który po godzinach
przerabia materiały techniczne (np. lekcje kursu 10xDevs) i chce zamienić
przeczytany tekst w fiszki. Sam dobiera materiał, sam decyduje, które fiszki
są warte zapamiętania. Aplikacja jest wieloużytkownikowa (każdy ma własne konto
i własne fiszki), ale nie ma ról: jest jeden typ użytkownika.

## Wizja rozwiązania

Użytkownik loguje się, wkleja fragment tekstu, a AI proponuje zestaw kandydatów
na fiszki (przód/tył). Każdego kandydata użytkownik jawnie akceptuje, poprawia
albo odrzuca. Tylko zaakceptowane fiszki trafiają do jego decka, gdzie może je
przeglądać, edytować i usuwać. Fiszki są jego własnością i nikt inny ich nie
widzi. Sesje powtórek (SRS) są naturalnym kolejnym krokiem, ale nie warunkiem
sensu tej wersji.

## Zakres MVP

Najmniejszy przepływ dowodzący sensu ("north star" tej wersji):

**S-01 gated generation loop:** zalogowany użytkownik wkleja tekst,
uruchamia generowanie, dostaje listę kandydatów, dla każdego decyduje
akceptuj / edytuj / odrzuć, klika "Zapisz do decka" i widzi zaakceptowane
fiszki na liście swojego decka.

Do tego, jako dopełnienie wymagań certyfikacji 10xBuilder:
- konto i logowanie (email + hasło), dostęp do fiszek wyłącznie właściciela,
- deck: lista, edycja i usuwanie zapisanych fiszek (pełny CRUD na danych
  trwałych),
- statystyka generowania (ile wygenerowano, ile zaakceptowano) zapisana przy
  każdej generacji, bo to jedyny sposób zmierzenia kryterium sukcesu.

Reguła domenowa, która odróżnia to od pustego CRUD-a: **fiszka trafia do decka
wyłącznie po jawnej decyzji człowieka; zapis zaakceptowanych kandydatów jest
atomowy (wszystkie albo żaden); kandydaci odrzuceni i nierozstrzygnięci nigdy
nie stają się fiszkami.**

## Non-goals

- **Sesje powtórek / algorytm SRS** - w tej wersji nie. Powód: tydzień na
  całość, a certyfikacja wymaga logiki biznesowej, którą już daje bramka
  akceptacji. SRS to pierwszy kandydat na następny slice, gdy MVP jest oddane.
- **Ręczne tworzenie fiszek od zera** - nie w MVP. Powód: Create jest już
  pokryte zapisem zaakceptowanych kandydatów; edycja kandydata przed zapisem
  pokrywa potrzebę "poprawić to, co AI źle zrozumiało".
- **Import plików (PDF, DOCX, URL)** - tylko kopiuj-wklej. Powód: parsowanie
  formatów to osobny projekt.
- **Współdzielenie decków, role, zespoły** - jeden użytkownik, jego dane.
- **Aplikacja mobilna, PWA, offline** - tylko web.
- **Usuwanie konta z retencją** - nie w MVP (w kursowej roadmapie S-05).
- **Własny algorytm SRS, statystyki nauki, gamifikacja** - poza zakresem.

## Warunek zakończenia

Projekt jako projekt zaliczeniowy należy zamknąć, gdy:
1. formularz zgłoszenia bloku 10xBuilder został wysłany przed 14 września 2026
   23:59 z linkiem do repo i publicznego URL, oraz
2. minęły dwa tygodnie od terminu bez wezwania do poprawek (reguła kursu:
   "cisza = dobrze"), albo poprawki zostały wykonane i zaakceptowane.

Sprawdzalne bez pytania autora: data wysłania formularza w wiadomościach
platformy oraz obecność certyfikatu na koncie. Po spełnieniu warunku dalszy
rozwój (SRS) jest nowym projektem lub nową fazą z własną decyzją, nie
kontynuacją tego.

## Decyzje podjęte w sesji

1. **Projekt to własna wersja 10xCards**, oficjalnego przykładu kursu - nie
   trzeba negocjować zakresu, materiały kursu dają PRD, roadmapę i stack.
2. **Termin: trzeci (14.09.2026)**, jedyny pozostały. Wyróżnienie nie wchodzi
   w grę, więc publiczny URL jest opcjonalny, ale robimy go (koszt mały,
   sprawdzający oceniają też screenshoty z działającej aplikacji).
3. **Zakres cięty do S-01 + F-01 + CRUD decka.** SRS parkujemy, mimo że w kursie
   north star to S-04. Powód: tydzień czasu, a wymagania certyfikacji spełnia
   już bramka akceptacji.
4. **Dokumenty fundamentu żyją w `context/foundation/`** (odstępstwo od
   meta-struktury), bo tam szuka ich mvp-check i sprawdzający.
5. **Auth: email + hasło** (nie magic link), bo test e2e musi logować się
   deterministycznie bez skrzynki pocztowej.
6. **AI przez OpenRouter** z możliwością mockowania w testach; w e2e provider
   jest podmieniany na deterministyczny mock, żeby test nie zależał od sieci
   i nie kosztował.
7. **Edycja kandydata przed zapisem jest częścią bramki** (akceptuj / edytuj
   i akceptuj / odrzuć), bo to najtańszy sposób, by fiszki były "takie, którym
   ufam".
8. **Zapis do decka jest atomowy** - wszystkie zaakceptowane albo żadna.
9. **Limit długości wklejanego tekstu** 1 000 - 10 000 znaków (walidacja po
   obu stronach), żeby koszt i czas generacji były przewidywalne.
10. **Każda generacja zapisuje statystykę** (liczba kandydatów, liczba
    zaakceptowanych, liczba edytowanych) - to źródło kryterium sukcesu.

## Otwarte pytania

- Czy oficjalny PRD 10xCards z preworku 4.2 (dostępny tylko na platformie)
  zawiera wymagania, których nie ma w tym dokumencie? Do sprawdzenia przez
  Tomasza przed akceptacją PRD; różnice dopisać jako FR albo świadomie
  odrzucić.
- Model do generowania (tani i szybki, np. klasa Haiku / Flash przez
  OpenRouter) - wybór w `tech-stack.md`, nie tutaj.
