# Deploy plan - app-10xcards

- **Platforma:** Cloudflare Workers (Worker `app-10xcards`, konto Tomasza,
  subdomena `tomasz-sinkiewicz.workers.dev`) + Supabase hostowany
  (`pmexsftaconiyztrvjuu`, eu-west-1) + OpenRouter. Szczegóły i ryzyka:
  `context/foundation/infrastructure.md`.
- **Środowiska:** local (`npm run dev`, `.env`, `AI_PROVIDER=mock` albo
  `openrouter`) → production (`wrangler deploy`). Bez stagingu.
- **Publiczny URL:** https://app-10xcards.tomasz-sinkiewicz.workers.dev

## Faza 1: przygotowanie (2026-09-07)

- [x] Konto Cloudflare, subdomena workers.dev, `npx wrangler login` w Terminalu (H-3).
- [x] Projekt Supabase zlinkowany, migracje wypchnięte (`supabase db push`, plan 0901).
- [x] Sekrety w Cloudflare przez `npx wrangler secret put`: `SUPABASE_URL`,
      `SUPABASE_KEY` (publishable), `OPENROUTER_API_KEY`. Wartości poza repo.
- [x] Zmienne niesekretne w `wrangler.jsonc` `vars`: `AI_PROVIDER=openrouter`,
      `OPENROUTER_MODEL=google/gemini-2.5-flash-lite`.

## Faza 2: pierwsze wdrożenie (2026-09-07)

- [x] `npm run build && npx wrangler deploy` → wersja `bdea2fae` (pierwsza),
      `90586698` (po poprawce odczytu zmiennych w runtime).
- [x] Weryfikacja: `curl -s -o /dev/null -w '%{http_code}' <URL>/` → 200, brak
      banera "Supabase nie jest skonfigurowany"; `<URL>/generate` bez sesji → 302
      na `/auth/signin`.
- [x] Smoke API na produkcji (curl z nagłówkiem `Origin`): rejestracja 302 →
      `/generate`; generacja 2 508 znaków → 201, model
      `google/gemini-2.5-flash-lite`, 8 kandydatów, 3,0 s; zapis 1 accepted +
      1 edited + 1 rejected → 200, deck pokazuje 2 fiszki; generacja 9 999 znaków
      → 201, 11 kandydatów, 3,9 s (limit CPU Workera nie osiągnięty).

## Faza 3: automatyzacja

- [ ] Auto-deploy z CI: **świadomie nie** w MVP (tech-stack D7, Parked w roadmapie);
      deploy ręczny z Maca komendą z runbooka. Warunek zmiany: więcej niż jedna
      osoba deployująca albo powtarzalne pomyłki ręczne.
- [x] Rollback: procedura `npx wrangler rollback <version-id>` spisana
      w `runbooks/deploy-cloudflare.md`; **nie testowana na produkcji**, bo
      jedyna poprzednia wersja (`bdea2fae`) ma znany błąd (mock zamiast
      OpenRouter). Do przetestowania przy pierwszym deployu S-02.

## Smoke checklist po każdym wdrożeniu

- [ ] `curl -s -o /dev/null -w '%{http_code}\n' https://app-10xcards.tomasz-sinkiewicz.workers.dev/` → 200
- [ ] Logowanie w przeglądarce, generacja z krótkiego tekstu, zapis, deck.
- [ ] `npx wrangler tail --format pretty` przez 2 minuty bez `error`.
- [ ] `npx wrangler deployments list` pokazuje nową wersję jako aktywną.
