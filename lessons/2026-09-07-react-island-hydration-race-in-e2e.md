# Wpis do formularza przed hydracją wyspy React ginie

- **Data:** 2026-09-07
- **Kontekst:** plan 0002, e2e decka; wcześniej losowe pady e2e rejestracji.

## Co się stało

Astro renderuje wyspę (`client:load`) jako HTML na serwerze; Playwright widzi
pola od razu i wpisuje tekst. Chwilę później React hydratuje komponent i dla
kontrolowanych pól ustawia wartość ze stanu początkowego (pustą). Test klika
"Generuj" na pustym polu i dostaje "za krótki" albo formularz rejestracji nie
przechodzi walidacji klienta i zostaje na `/auth/signup`. Objaw losowy, zależny
od czasu hydracji, więc wyglądał na flaky test.

## Reguła

- Każda wyspa z formularzem blokuje pola do czasu hydracji: hook
  `useHydrated()` (`useSyncExternalStore`, bez `setState` w efekcie) i
  `<fieldset disabled={!hydrated}>`. Playwright czeka na `enabled`, więc test
  nie potrzebuje żadnych `sleep`.
- Test e2e, który pada "czasami", to najpierw podejrzenie wyścigu z hydracją,
  a dopiero potem retry.
