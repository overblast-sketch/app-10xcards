# Decisions - decyzje trwałe projektu

Rejestr decyzji, które przeżywają sesje i determinują dalszą pracę:

- `tech-stack.md` - czym budujemy + "why this stack" (software/tooling;
  szablon: project-structure/templates/tech-stack.md),
- `infrastructure.md` - gdzie i jak to działa: platforma, sekrety, rollback,
  uprawnienia (software/infra; szablon: project-structure/templates/infrastructure.md),
- `adr-NNNN-<slug>.md` - kolejne decyzje architektoniczne/kierunkowe
  (szablon: project-structure/templates/adr.md).

Zasady:
- decyzja ma zawsze: kontekst, rozważane opcje, wybór + uzasadnienie,
  **warunki rewizji** (co musi się zmienić, żeby wrócić do tematu),
- decyzji nie edytuje się po fakcie; zmiana zdania = nowy ADR linkujący stary,
- agent: złamanie decyzji z tego katalogu wymaga nowego ADR, nie cichego odstępstwa,
- pole `Status` ADR-a i kolumna `Status` tej tabeli mają **zamknięty zbiór**:
  `proposed | accepted | superseded | abandoned`, jeden token bez dopisków;
  data, osoba i pozycja `H-N` idą do wiersza `Akceptacja` (szablon `templates/adr.md`).

| ADR | Tytuł | Data | Status |
|---|---|---|---|
| - | - | - | - |
