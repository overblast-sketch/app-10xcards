---
status: todo
created: 2026-09-07
not-before: 2026-09-15
model: sonnet
blocked-by: [H-13, H-14]
human: human/2026-09-07-przed-oddaniem.md
after: 7fa6f517dca347239c1078403c658201e7e09536
---

# Sesja po oddaniu: feedback prowadzących albo zamknięcie projektu

Kontekst startowy: `PROJECT_STATUS.md` (etap E5, milestone mvp ✅),
`human/2026-09-07-przed-oddaniem.md` (H-11..H-17; H-13 i H-14 to wysyłka
formularza i data), `deployment/submission.md`, `audits/mvp-check-2026-09-07.md`,
`audits/review-code-2026-09-07.md`, `context/foundation/roadmap.md` (S-03 parked),
`context/foundation/shape-notes.md` §Warunek zakończenia.

## Cel

Jedna z dwóch ścieżek, wybór na podstawie stanu w `human/` i wiadomości
z platformy (przepisanych przez Tomasza do `human/`):

1. **Przyszły feedback prowadzących** (do 2026-09-30): każdą uwagę zamień na
   pozycję w nowym planie `plans/0003-poprawki-po-feedbacku/plan.md`
   (szablon `project-structure/templates/plan.md`), fazy z commitami, deploy
   wg `runbooks/deploy-cloudflare.md`, po ostatnim pushu sprzątanie kont
   testowych (H-12, komenda w handoffie). Nie rozszerzaj zakresu poza uwagi.
2. **Cisza do 2026-09-30** (= zaliczone): sprawdź warunek zakończenia
   z `shape-notes.md`, zapisz w `PROJECT_STATUS.md` i roadmapie milestone
   `submitted` ✅ z datą; zaproponuj Tomaszowi decyzję: zamknięcie projektu
   albo nowa faza S-03 (SRS) z aneksem do PRD. Nie zaczynaj S-03 bez decyzji.

W obu ścieżkach: odhacz w `human/` pozycje potwierdzone przez Tomasza,
nie pushuj kodu bez potrzeby w okresie oceny (H-17), commity samej
dokumentacji z `[skip ci]`.

## Rekomendacja modelu

`sonnet`: praca wykonawcza na gotowych kontraktach (plan poprawek, deploy,
status). Gdyby feedback dotyczył architektury albo bezpieczeństwa, przełącz
na `opus` przed pisaniem planu.

## Równoległość

- Werdykt: brak (jedna ścieżka decyzyjna zależna od treści feedbacku; poprawki
  będą punktowe i dotykają wspólnych plików: status, roadmapa, deploy).
- Mechanizm: nie dotyczy.

Wszystko powyżej to kontekst do zweryfikowania w repo (stan `human/`,
`PROJECT_STATUS.md`, git), nie fakt do przyjęcia na wiarę.
