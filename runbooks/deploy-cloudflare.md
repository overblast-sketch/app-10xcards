# Deploy na Cloudflare Workers

Procedura, która zadziałała 2026-09-07 (plan 0902). Wykonywana z Maca,
z katalogu projektu, po `nvm use 22`.

## Warunki wstępne

- `npx wrangler whoami` pokazuje konto Tomasza (inaczej `npx wrangler login`
  w Terminalu, nie w sesji agenta: potrzebuje przeglądarki i TTY).
- Migracje bazy wypchnięte: `npx supabase db push --linked`.

## Deploy

```bash
npm run build
npx wrangler deploy
```

Wynik: `Current Version ID: <id>` i URL
`https://app-10xcards.tomasz-sinkiewicz.workers.dev`. Build trwa ~10 s,
upload ~15 s.

## Sekrety (tylko przy pierwszym deployu albo rotacji)

```bash
printf '%s' "$WARTOSC" | npx wrangler secret put SUPABASE_URL
printf '%s' "$WARTOSC" | npx wrangler secret put SUPABASE_KEY
printf '%s' "$WARTOSC" | npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret list
```

Sekrety działają od razu, bez redeployu. Zmienne niesekretne
(`AI_PROVIDER`, `OPENROUTER_MODEL`) są w `wrangler.jsonc` i wchodzą z deployem.

Pułapka: zmienne `astro:env` z `access: "public"` są wstrzykiwane w czasie
builda z `.env`, nie czytane z bindingów Workera. Dlatego wszystkie zmienne
serwerowe w `astro.config.mjs` mają `access: "secret"`.

## Weryfikacja

```bash
U=https://app-10xcards.tomasz-sinkiewicz.workers.dev
curl -s -o /dev/null -w '%{http_code}\n' "$U/"            # 200
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$U/generate"   # 302 -> /auth/signin
npx wrangler tail --format pretty                          # logi na żywo, Ctrl+C
```

Pełny smoke przez API (rejestracja, generacja, zapis) wymaga nagłówka
`Origin: $U` przy POST, bo Astro odrzuca bez niego żądania (403, ochrona CSRF).

## Rollback

```bash
npx wrangler deployments list          # wersje z ID i datą
npx wrangler rollback <version-id>     # przywraca kod poprzedniej wersji
```

Sekrety i zmienne zostają. Uwaga: każde `wrangler secret put` też tworzy
nową wersję na liście, więc "poprzednia wersja kodu" nie zawsze jest drugą
na liście; sprawdź datę i wiadomość. Migracje bazy nie mają rollbacku
automatycznego (`infrastructure.md` §Rollback). Przetestowane 2026-09-07
(`--yes` pomija pytanie o potwierdzenie).

## Znane koszty

- Cloudflare Workers plan free: 100 000 requestów dziennie.
- OpenRouter `google/gemini-2.5-flash-lite`: generacja 10 k znaków to
  ułamek centa; limit wydatków ustawiony na kluczu.
