# Prettier z lint-staged psuje blok generowany PROJECT_STATUS.md

- **Data:** 2026-09-07
- **Kontekst:** plan 0901, commity dokumentacji po fazie 4.

## Co się stało

lint-staged ze startera formatuje `*.md` prettierem przy każdym commicie.
Prettier wstawia pustą linię po znaczniku `<!-- generated:begin ... -->`,
a `tools/status-block.py --check` porównuje blok co do bajtu i zgłasza
rozjazd, mimo że treść jest identyczna. Trzy commity poszły w pętlę:
regeneracja → prettier → FAIL.

Drugi objaw: prettier różnie łamie długą linię kontynuacji w `## Progress`
planu przy kolejnych przebiegach (`MM` w `git status` po commicie).

## Reguła

- `PROJECT_STATUS.md` jest w `.prettierignore`: blok generowany ma jednego
  pisarza (ADR-0010/0015 floty) i formatter nim nie jest.
- Linie kontynuacji w `## Progress` piszemy tak, żeby żadne zdanie w
  backtickach nie musiało się łamać; prettier zostawia je wtedy w spokoju.
