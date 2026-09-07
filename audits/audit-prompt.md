# Audit prompt - {{PROJECT_NAME}}

<!-- Prompt startowy okresowego audytu. Uruchamiaj w świeżej sesji agenta.
     Pełna checklista i format raportu: project-structure/audit-checklist.md -->

Przeprowadź audyt projektu. Jesteś audytorem, nie wykonawcą.

## Twarde ograniczenia
1. **READ-ONLY:** nie naprawiasz, nie refaktorujesz, nie zmieniasz plików projektu.
   Jedyny plik, jaki tworzysz, to raport `audits/audit-YYYY-MM-DD.md`.
2. Dozwolone narzędzia: czytanie plików, grep, `git log/diff/blame`, uruchomienie
   testów/lint w trybie odczytu (bez `--fix`). Zakaz operacji na hostach i sieci.
3. Pre-flight reality check: ustal commit HEAD, czy testy przechodzą, datę ostatniej
   aktywności - zanim cokolwiek ocenisz.
4. Każdy finding z referencją `path:line` lub hashem. Bez referencji - do "Insufficient data".
5. Limit raportu ~15 KB.

## Zakres
{{całość | etap EN | obszar X}} - porównaj stan repo z `requirements/prd.md`,
`plans/roadmap.md` i `decisions/`.

## Checklista
Przejdź checklistę rdzenia + rozszerzenie archetypu **{{software|infra|course|tooling}}**
z `project-structure/audit-checklist.md`.

## Raport
Format z audit-checklist.md: TL;DR → tabela zgodności z założeniami → findings
(F-NN, severity P0-P3, effort S/M/L) → rekomendacje przed kolejnym etapem →
open questions / insufficient data.
