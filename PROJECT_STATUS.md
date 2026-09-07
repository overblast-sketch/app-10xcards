# PROJECT_STATUS

Jeden plik-odpowiedź: gdzie jesteśmy i od czego kontynuować. Blok generowany jest
wyprowadzany z `## Progress` planów i z gita; resztę pliku piszesz ręcznie.

**Reguła rozmiaru:** kanoniczna „Reguła rozmiaru i cięcia" floty (M-003,
`project-structure/migrations.md`) - definicja, próg i komenda pomiaru
mieszkają wyłącznie tam (M-003 pkt 5).

<!-- generated:begin: python3 tools/status-block.py --print -->
- **Aktywne plany (0):** brak
- **Ostatnio domknięty plan:** brak
- **Plany zarchiwizowane:** 0
<!-- generated:end -->

- **Ostatnia aktualizacja:** 2026-09-07
- **Etap:** E1: foundation (shape-notes i PRD zaakceptowane)
- **Następny krok:** napisać `context/foundation/tech-stack.md`,
  `infrastructure.md`, `roadmap.md` i `test-plan.md`, potem bootstrap kodu
  z 10x Astro Starter (plan `plans/0901-*` dla F-01).
- **Termin twardy:** zgłoszenie do certyfikacji 10xBuilder do 2026-09-14 23:59
  (trzeci, ostatni termin).

## Wątki otwarte

- Oficjalny PRD 10xCards z preworku 4.2 (platforma kursu) nieporównany
  z `prd.md`; różnice do dopisania albo świadomego odrzucenia.
- Konta zewnętrzne do założenia przez człowieka: Supabase (projekt), OpenRouter
  (klucz), Cloudflare (Workers), GitHub (publiczny mirror). Lista w `human/`.

## Dziennik (najnowsze na górze) <!-- dziennik -->

### 2026-09-07
- Powołanie projektu ze szkieletu `project-structure` (rdzeń + moduł software).
- Decyzja: dokumenty fundamentu w `context/foundation/` (odstępstwo O1 w
  AGENTS.md), bo tak szuka ich mvp-check kursu.
- `shape-notes.md` i `prd.md` napisane i zaakceptowane (16 FR, 10 US, reguła
  bramki akceptacji z atomowym zapisem; SRS i ręczne fiszki w non-goals).
- Wybory z sesji: 10x Astro Starter (Astro + React + Supabase), OpenRouter,
  Cloudflare, termin trzeci (14.09.2026).
