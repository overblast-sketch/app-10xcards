# `astro:env` z `access: "public"` nie czyta zmiennych Workera w runtime

- **Data:** 2026-09-07
- **Kontekst:** plan 0902, pierwszy deploy na Cloudflare.

## Co się stało

`AI_PROVIDER` i `OPENROUTER_MODEL` były w schemacie `astro:env` jako
`context: "server", access: "public"`. Build na Macu wstrzyknął wartości z
lokalnego `.env` (`mock`), a `vars` w `wrangler.jsonc` produkcja zignorowała:
pierwsza generacja na publicznym URL poszła na mocku, mimo że binding
`env.AI_PROVIDER ("openrouter")` był widoczny w logu deployu.

## Reguła

- Każda zmienna serwerowa, która ma różnić się między środowiskami, dostaje
  `access: "secret"` w `astro.config.mjs`, nawet gdy nie jest sekretem: tylko
  ten tryb czyta bindingi platformy w czasie działania.
- Po deployu sprawdzamy nie tylko HTTP 200, ale też pole `model` w odpowiedzi
  API generacji: dowód, że produkcja używa konfiguracji produkcyjnej.
