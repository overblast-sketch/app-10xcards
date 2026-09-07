# Test plan - app-10xcards

<!-- Risk-based: zaczynamy od decyzji CO chronić, nie od pisania testów.
     Szablon i zasady (cost × signal, problem wyroczni, celowe psucie):
     project-structure/templates/test-plan.md. Narzędzie certyfikacyjne kursu
     (mvp-check) wymaga, by co najmniej jeden realny test mapował się na
     nazwane tu ryzyko; mapowanie jest w kolumnie "Test". -->

## Mapa ryzyk (impact × likelihood)

| # | Ryzyko | Impact | Likelihood | Warstwa testu (cost × signal) | Test | Status |
|---|---|---|---|---|---|---|
| R1 | **Przeciek przez bramkę akceptacji:** kandydat `pending` albo `rejected` trafia do decka, albo zaakceptowany nie trafia; edycja ginie przy zapisie. To łamie jedyną regułę biznesową produktu (FR-008 do FR-011). | wysoki | średnie (logika stanów pisana przez agenta, łatwo o off-by-one) | unit na czystej funkcji `selectCardsToSave` + e2e pełnej pętli | `tests/unit/gate.test.ts`, `tests/e2e/gated-generation.spec.ts` | ⬜ |
| R2 | **Zapis nieatomowy:** błąd w połowie zapisu zostawia część fiszek z generacji (FR-009, US-006). | wysoki | niskie przy RPC w transakcji, wysokie przy insertach z klienta | integration: wywołanie RPC `save_generation` z jednym niepoprawnym kandydatem, oczekiwane zero fiszek | `tests/integration/save-generation.test.ts` (lokalny Supabase) | ⬜ |
| R3 | **IDOR / wyciek między użytkownikami:** użytkownik A czyta, edytuje lub usuwa fiszkę B po ID (FR-004, US-009). | wysoki | średnie (RLS łatwo zapomnieć przy nowej tabeli) | integration: dwóch użytkowników, klient A woła API na zasobie B, oczekiwane 403/404 i brak zmiany | `tests/integration/idor.test.ts` | ⬜ |
| R4 | **Tekst poza limitem 1 000 - 10 000 znaków wysłany do AI:** koszt i czas nieprzewidywalne; komunikat o błędzie nie pojawia się (FR-005, US-004). | średni | średnie | unit na `validateSourceText` (granice 999/1000/10000/10001) + asercja w e2e, że przy 300 znakach nie ma wywołania providera | `tests/unit/validate-source-text.test.ts` | ⬜ |
| R5 | **Dostawca AI zwraca nie-JSON, pustą listę albo timeout:** użytkownik traci wklejony tekst albo widzi surowy błąd (FR-007). | średni | wysokie (zewnętrzne API) | unit adaptera OpenRouter z zamockowanym `fetch` (nie-JSON, 429, timeout, pusta lista) | `tests/unit/openrouter-provider.test.ts` | ⬜ |
| R6 | **Trasy produktu dostępne bez logowania** po dodaniu nowych stron (FR-003, US-002). | wysoki | niskie (middleware ze startera) | e2e: wejście na `/generate` i `/deck` bez sesji kończy się przekierowaniem na `/auth/signin` | `tests/e2e/auth-guard.spec.ts` | ⬜ |
| R7 | **Statystyka generacji niezgodna z decyzjami** (FR-012, US-010). | niski | średnie | unit: liczby wyprowadzone z tej samej listy decyzji co R1 | w `tests/unit/gate.test.ts` | ⬜ |

Priorytet implementacji: R1 (unit, potem e2e) → R6 → R4 → R5 → R3 → R2 → R7.
R1 e2e jest testem "z perspektywy użytkownika" wymaganym przez certyfikację.

Wyrocznia dla R1/R7: oczekiwane wyniki liczone ręcznie z PRD US-005
(5 kandydatów: 2 accepted, 1 edited, 1 rejected, 1 pending → 3 fiszki,
statystyka 5/2/1/1), nie z implementacji.

## Oś bezpieczeństwa

| Obszar | Dotyczy? | Ryzyko | Test |
|---|---|---|---|
| authz / IDOR | tak | R3 | integration, dwóch użytkowników |
| injection | tak (prompt injection z tekstu źródłowego) | tekst wklejony każe modelowi zwrócić coś innego niż fiszki | walidacja zod odpowiedzi (schemat kandydatów, limity długości); tekst trafia do promptu jako dane w osobnej sekcji, nie jako instrukcja; brak testu automatycznego w MVP, próba ręczna przed oddaniem |
| sekrety w kodzie/logach | tak | `service_role` albo klucz OpenRouter w repo lub logach | pre-commit grep `service_role|sk-or-`; logi nie drukują nagłówków |
| rate-limit / nadużycia | tak | koszt OpenRouter przy spamie generacji | limit wydatków na kluczu (H-2); bez rate-limitu w aplikacji w MVP, zapisane w Parked |

## Quality gates

| Bramka | Warstwa | Komenda |
|---|---|---|
| lint-staged (eslint --fix, prettier) | pre-commit (husky) | `npx lint-staged` |
| grep sekretów | pre-commit | `git diff --cached \| grep -E 'service_role\|sk-or-' && exit 1` |
| unit + integration | pre-push | `npm test` (Vitest) |
| lint + `astro check` + unit + build | CI (GitHub Actions, push i PR do `main`) | `.github/workflows/ci.yml` |
| e2e | lokalnie przed merge slice'a, w CI po D7 | `npm run test:e2e` |

## Cookbook

TBD - uzupełniane, gdy pierwszy test danego typu naprawdę działa.
Planowany układ: `tests/unit/`, `tests/integration/` (wymaga `npx supabase
start`), `tests/e2e/` (Playwright, `AI_PROVIDER=mock`, użytkownik testowy
tworzony w `globalSetup` przez API rejestracji). Test referencyjny powstanie
przy R1.
