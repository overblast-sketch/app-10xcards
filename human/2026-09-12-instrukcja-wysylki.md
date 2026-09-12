# Instrukcja wysyłki krok po kroku (2026-09-12)

Rozwinięcie pozycji H-11..H-17 z `human/2026-09-07-przed-oddaniem.md` do
poziomu kliknięć, plus odzyskanie hasła do konta w aplikacji. Sesja agenta
prowadzi Tomasza przez te kroki (prompt `prompts/2026-09-12-prowadzenie-do-wysylki.md`).
Termin wysyłki: **2026-09-14, 23:59**.

Stan 2026-09-12 (zmierzony): Supabase `ACTIVE_HEALTHY`, aplikacja HTTP 200,
CI zielone dla `d94c546`, w bazie 1 konto prawdziwe (założone 2026-09-07
11:47 UTC) i 12 testowych (`@example.com`) założonych po sesji z 7.09
(ktoś uruchomił testy lokalnie).

## H-0 Hasło do konta w aplikacji (gdy nie pamiętasz)

Aplikacja nie ma "nie pamiętam hasła" (non-goal MVP, brak wysyłki maili).
Najprościej: usuń konto i załóż ponownie na ten sam adres.

1. https://supabase.com/dashboard/project/pmexsftaconiyztrvjuu/auth/users
2. Znajdź swój adres (jedyny bez `@example.com`), trzy kropki → **Delete user**.
   Alternatywa: agent usuwa to konto na polecenie "usuń moje konto <adres>".
3. https://app-10xcards.tomasz-sinkiewicz.workers.dev/auth/signup → ten sam
   adres, nowe hasło (min. 6 znaków), rejestracja od razu loguje.
4. Hasło do menedżera haseł. Agent nie ustawia haseł (sekrety poza czatem).

Inne hasła: Supabase loguje się przez GitHub (brak hasła); hasło bazy:
Project Settings → Database → Reset database password (niepotrzebne teraz);
GitHub i platforma kursu: "Forgot password" na stronie logowania.

## H-16 najpierw: aktywność w Supabase (1 minuta)

Plan free pauzuje projekt po 7 dniach bez ruchu; ostatnia aktywność 2026-09-07,
sprawdzający mogą wejść do 30.09. Dziś i potem 16.09, 20.09, 24.09, 28.09:
zaloguj się w aplikacji, wygeneruj fiszki z dowolnego tekstu, zapisz jedną.
Raz w tygodniu otwórz dashboard projektu; przycisk **Restore project** = kliknij
i poczekaj ~2 minuty. Agent sprawdza status komendą
`npx supabase projects list` (pole `status`).

## H-11 Screenshoty (~20 minut)

1. https://app-10xcards.tomasz-sinkiewicz.workers.dev w przeglądarce na
   komputerze, okno pełnej szerokości.
2. Zrzut `01-landing.png`: landing przed zalogowaniem (Cmd+Shift+4, zaznacz okno).
3. **Zaloguj się** (konto z 7.09 albo nowe po H-0; nie `@example.com`).
   Zrzut `02-login.png`: ekran logowania lub rejestracji.
4. Na `/generate` wklej fragment lekcji, min. 1 000 znaków (np.
   `course-10xdevs3/lessons/10xDevs Workflow/roadmapa-mvp-milestony-zaleznosci-i-priorytety.md`).
   Zrzut `03-generate-text.png`: pole z tekstem i zielonym licznikiem.
5. **Generuj fiszki**, kilka sekund. Kandydaci: pierwszy **Akceptuj**, drugi
   **Edytuj** (zmień tył, **Zapisz zmiany i akceptuj**), trzeci **Odrzuć**.
   Zrzut `04-candidates.png`: trzy kolory stanów i "Zapisz do decka (2)".
6. **Zapisz do decka**. Zrzut `05-deck-summary.png`: `/deck` z zielonym banerem
   podsumowania i fiszkami.
7. Przy jednej fiszce **Edytuj**, zmień tekst, zrzut `06a-deck-edit.png`
   w trakcie edycji, zapisz. Przy innej **Usuń**, zrzut `06b-deck-delete.png`
   z pytaniem "Usunąć tę fiszkę?", potwierdź.
8. https://github.com/overblast-sketch/app-10xcards. Zrzut `07-repo.png`:
   strona główna z listą katalogów (`context`, `tests`, `.github`, `plans`, `audits`).
9. Zakładka **Actions**, ostatni run (commit `d94c546`). Zrzut `08-ci.png`:
   zielone joby `checks` i `e2e`.
10. https://supabase.com/dashboard/project/pmexsftaconiyztrvjuu/editor, tabela
    `flashcards`. Zrzut `09-supabase-rls.png`: etykieta RLS enabled przy
    tabeli. Alternatywa: `audits/mvp-check-2026-09-07.md` na GitHubie.
11. Pliki zostają w `~/Downloads` do wgrania w formularzu; do repo nie trzeba.

## H-12 Sprzątanie bazy (2 minuty, ostatnie przed wysyłką)

Najprościej: powiedz agentowi "posprzątaj konta testowe". Usuwa konta
z wzorcami `e2e-`, `smoke-`, `idor-`, `atomic-`, `probe-`, `injection-`
w domenie `example.com`; prawdziwe konto zostaje. Nieodwracalne, dlatego
agent czeka na to słowo i pokazuje liczbę usuniętych oraz listę pozostałych.

Samodzielnie, w Terminalu:
```
cd ~/Documents/cloude-projects/app-10xcards && source ~/.nvm/nvm.sh && nvm use 22
npx supabase db query --linked "delete from auth.users where email ~ '^(e2e-|smoke-|idor-|atomic-|probe-|injection-).*@example\.com$'"
npx supabase db query --linked "select email from auth.users"
```
Drugie polecenie ma pokazać tylko Twój adres. Potem nie uruchamiaj `npm test`
ani `npm run test:e2e` (znów założą konta) i nie pushuj (H-17).

## H-13 Formularz (~30 minut, do 2026-09-14 23:59)

1. Platforma kursu → formularz zgłoszeniowy 10xBuilder (link w poście
   o certyfikacji, sekcja projektu zaliczeniowego albo wiadomość od prowadzących).
2. Zakres: **tylko 10xBuilder** (bez Architekta i Championa).
3. Link do repo: `https://github.com/overblast-sketch/app-10xcards`.
4. Publiczny URL: `https://app-10xcards.tomasz-sinkiewicz.workers.dev`.
5. "Opis projektu": sekcja **Opis projektu** z `deployment/submission.md`
   (trzy akapity). Agent może wypisać ją do skopiowania.
6. "Twój komentarz": sekcja **Jak spełniam wymagania** wraz z **Uwagi dla
   sprawdzających** z tego samego pliku.
7. Załącz 9 screenshotów z H-11.
8. Przed "Wyślij": w oknie incognito repo otwiera się bez logowania, aplikacja
   odpowiada. Agent może sprawdzić komendą (`curl`, `gh api`).
9. Wyślij. Jeden raz.

## H-14 Data wysłania (2 minuty)

Powiedz agentowi "wysłane YYYY-MM-DD". Agent dopisuje datę przy H-13 i H-14
w `human/2026-09-07-przed-oddaniem.md`, w `PROJECT_STATUS.md` i odhacza
milestone `submitted` w `context/foundation/roadmap.md`; commit z `[skip ci]`.

## H-15 Wiadomości na platformie (do 2026-09-30)

Co 2-3 dni: wiadomości prywatne i komentarze pod zgłoszeniem. Cisza do 30.09
= zaliczone. Uwagi prowadzących: wklej treść w sesji agenta w `app-10xcards`
(`/model sonnet` → `/clear` → `/start`, prompt `2026-09-07-po-oddaniu-feedback.md`).

## H-17 Bez pushy w okresie oceny

Do 30.09 bez pushy kodu do `main`, chyba że prowadzący poproszą. Push = CI =
nowe konta testowe; po zielonym CI powtórz H-12. Zmiany w samych `.md`
z `[skip ci]` w pierwszej linii commita.

## Kolejność na dziś

H-0 (jeśli hasło) → H-16 → H-11 (ta sama sesja w aplikacji) → H-12 (słowo do
agenta) → H-13 → H-14 (słowo do agenta).
