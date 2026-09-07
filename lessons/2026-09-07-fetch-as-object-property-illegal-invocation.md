# `fetch` przekazany jako właściwość obiektu daje "Illegal invocation" w workerd

- **Data:** 2026-09-07
- **Kontekst:** plan 0001, adapter OpenRouter, pierwsza prawdziwa generacja.

## Co się stało

Adapter trzymał `fetchImpl: config.fetchImpl ?? fetch` w obiekcie konfiguracji
i wołał `this.cfg.fetchImpl(url, init)`. W Node testy unit (z mockiem) przechodziły,
a `astro dev` (runtime workerd, ten sam co Cloudflare Workers) rzucał
`Illegal invocation: function called with incorrect this reference`, bo globalne
`fetch` wywołane z `this` innym niż globalThis jest w workerd błędem.

## Reguła

- Globalne API Web (`fetch`, `setTimeout`, `crypto.subtle.*`) przekazujemy
  przez wrapper strzałkowy `(input, init) => fetch(input, init)` albo
  `fetch.bind(globalThis)`, nigdy jako gołą referencję do właściwości obiektu.
- Każdy adapter do zewnętrznego API dostaje **jedno prawdziwe wywołanie** przed
  domknięciem fazy; mock w unitach nie wykrywa błędów runtime'u.
