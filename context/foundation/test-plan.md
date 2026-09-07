# Test plan - app-10xcards

<!-- Risk-based: zaczynamy od decyzji CO chronić, nie od pisania testów.
     Szablon i zasady (cost × signal, problem wyroczni, celowe psucie):
     project-structure/templates/test-plan.md. Narzędzie certyfikacyjne kursu
     (mvp-check) wymaga, by co najmniej jeden realny test mapował się na
     nazwane tu ryzyko; mapowanie jest w kolumnie "Test". -->

## Mapa ryzyk (impact × likelihood)

| #   | Ryzyko                                                                                                                                                                                                            | Impact | Likelihood                                                      | Warstwa testu (cost × signal)                                                                                               | Test                                                            | Status                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| R1  | **Przeciek przez bramkę akceptacji:** kandydat `pending` albo `rejected` trafia do decka, albo zaakceptowany nie trafia; edycja ginie przy zapisie. To łamie jedyną regułę biznesową produktu (FR-008 do FR-011). | wysoki | średnie (logika stanów pisana przez agenta, łatwo o off-by-one) | unit na czystej funkcji `selectCardsToSave` + e2e pełnej pętli                                                              | `tests/unit/gate.test.ts`, `tests/e2e/gated-generation.spec.ts` | ✅ unit `gate.test.ts` + e2e `gated-generation.spec.ts` (2026-09-07)                        |
| R2  | **Zapis nieatomowy:** błąd w połowie zapisu zostawia część fiszek z generacji (FR-009, US-006).                                                                                                                   | wysoki | niskie przy RPC w transakcji, wysokie przy insertach z klienta  | integration: wywołanie RPC `save_generation` z jednym niepoprawnym kandydatem, oczekiwane zero fiszek                       | `tests/integration/save-generation.test.ts` (lokalny Supabase)  | ⬜                                                                                          |
| R3  | **IDOR / wyciek między użytkownikami:** użytkownik A czyta, edytuje lub usuwa fiszkę B po ID (FR-004, US-009).                                                                                                    | wysoki | średnie (RLS łatwo zapomnieć przy nowej tabeli)                 | integration: dwóch użytkowników, klient A woła API na zasobie B, oczekiwane 403/404 i brak zmiany                           | `tests/integration/idor.test.ts`                                | ⬜                                                                                          |
| R4  | **Tekst poza limitem 1 000 - 10 000 znaków wysłany do AI:** koszt i czas nieprzewidywalne; komunikat o błędzie nie pojawia się (FR-005, US-004).                                                                  | średni | średnie                                                         | unit na `validateSourceText` (granice 999/1000/10000/10001) + asercja w e2e, że przy 300 znakach nie ma wywołania providera | `tests/unit/validate-source-text.test.ts`                       | ✅ unit + e2e (2026-09-07): 300 znaków nie wywołuje generacji, tekst zostaje w formularzu   |
| R5  | **Dostawca AI zwraca nie-JSON, pustą listę albo timeout:** użytkownik traci wklejony tekst albo widzi surowy błąd (FR-007).                                                                                       | średni | wysokie (zewnętrzne API)                                        | unit adaptera OpenRouter z zamockowanym `fetch` (nie-JSON, 429, timeout, pusta lista)                                       | `tests/unit/openrouter-provider.test.ts`                        | ✅ unit (2026-09-07): nie-JSON, 429 z ponowieniem, 401 bez ponowienia, timeout, pusta lista |
| R6  | **Trasy produktu dostępne bez logowania** po dodaniu nowych stron (FR-003, US-002).                                                                                                                               | wysoki | niskie (middleware ze startera)                                 | e2e: wejście na `/generate` i `/deck` bez sesji kończy się przekierowaniem na `/auth/signin`                                | `tests/e2e/auth-guard.spec.ts`                                  | ✅ (2026-09-07)                                                                             |
| R7  | **Statystyka generacji niezgodna z decyzjami** (FR-012, US-010).                                                                                                                                                  | niski  | średnie                                                         | unit: liczby wyprowadzone z tej samej listy decyzji co R1                                                                   | w `tests/unit/gate.test.ts`                                     | ✅ unit w `gate.test.ts` (2026-09-07)                                                       |

Priorytet implementacji: R1 (unit, potem e2e) → R6 → R4 → R5 → R3 → R2 → R7.
R1 e2e jest testem "z perspektywy użytkownika" wymaganym przez certyfikację.

Wyrocznia dla R1/R7: oczekiwane wyniki liczone ręcznie z PRD US-005
(5 kandydatów: 2 accepted, 1 edited, 1 rejected, 1 pending → 3 fiszki,
statystyka 5/2/1/1), nie z implementacji.

## Oś bezpieczeństwa

| Obszar                  | Dotyczy?                                   | Ryzyko                                                       | Test                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| authz / IDOR            | tak                                        | R3                                                           | integration, dwóch użytkowników                                                                                                                                                                       |
| injection               | tak (prompt injection z tekstu źródłowego) | tekst wklejony każe modelowi zwrócić coś innego niż fiszki   | walidacja zod odpowiedzi (schemat kandydatów, limity długości); tekst trafia do promptu jako dane w osobnej sekcji, nie jako instrukcja; brak testu automatycznego w MVP, próba ręczna przed oddaniem |
| sekrety w kodzie/logach | tak                                        | klucz `service_role` albo klucz OpenRouter w repo lub logach | pre-commit grep wzorców kluczy (definicja w `.husky/pre-commit`); logi nie drukują nagłówków                                                                                                          |
| rate-limit / nadużycia  | tak                                        | koszt OpenRouter przy spamie generacji                       | limit wydatków na kluczu (H-2); bez rate-limitu w aplikacji w MVP, zapisane w Parked                                                                                                                  |

## Quality gates

| Bramka                               | Warstwa                                  | Komenda                                                         |
| ------------------------------------ | ---------------------------------------- | --------------------------------------------------------------- |
| lint-staged (eslint --fix, prettier) | pre-commit (husky)                       | `npx lint-staged`                                               |
| grep sekretów                        | pre-commit                               | `git diff --cached \| grep -E 'service_role\|sk-or-' && exit 1` |
| unit + integration                   | pre-push                                 | `npm test` (Vitest)                                             |
| lint + `astro check` + unit + build  | CI (GitHub Actions, push i PR do `main`) | `.github/workflows/ci.yml`                                      |
| e2e                                  | lokalnie przed merge slice'a, w CI po D7 | `npm run test:e2e`                                              |

## Cookbook

- **Układ:** `tests/unit/` (Vitest, czyste funkcje z `src/lib/`),
  `tests/integration/` (Vitest, prawdziwy Supabase: **hostowany projekt
  testowy**, bo na Macu nie ma Dockera i `supabase start` nie działa; osobni
  użytkownicy testowi), `tests/e2e/` (Playwright, chromium, `AI_PROVIDER=mock`).
- **Komendy:** `npm test`, `npm run test:coverage`, `npm run test:e2e`
  (Playwright sam podnosi `astro dev` na porcie 4321, lokalnie reużywa
  działającego serwera).
- **Test referencyjny unit:** `tests/unit/validate-source-text.test.ts`:
  jedna funkcja, wartości graniczne z PRD, `toEqual` na całym wyniku.
- **Test referencyjny e2e:** `tests/e2e/auth-guard.spec.ts`: bez logowania,
  asercje na URL i nagłówek roli `heading`, plus wywołanie API przez
  `request` z asercją na status i JSON.
- **Test na prawdziwym Supabase:** `tests/e2e/auth-signup.spec.ts` rejestruje
  użytkownika `e2e-<timestamp>@example.com` na projekcie hostowanym; pomija
  się, gdy brak `SUPABASE_URL`/`SUPABASE_KEY` (CI bez sekretów). Użytkownicy
  testowi zostają w `auth.users`; sprzątanie ręczne w dashboardzie przed
  oddaniem.
- **Nazewnictwo:** plik = nazwa funkcji/przepływu; `describe` nosi ID FR
  i ryzyka z tej mapy, żeby mvp-check i review widziały mapowanie.
- **Celowe psucie (weryfikacja asercji):** przed pierwszym zielonym uruchomieniem
  odwróć jedną granicę w kodzie (np. `<` na `<=`) i sprawdź, że pada dokładnie
  ten test; zmiana nigdy nie jest commitowana.
