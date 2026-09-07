# Runbooks - procedury operacyjne

Reguła: runbook piszemy w momencie, gdy procedura **pierwszy raz zadziałała naprawdę**
(nie wcześniej, nie z głowy). Więcej niż ~3 komendy wykonywane sekwencyjnie → runbook;
krótsze → inline w planie/commicie. Nazwy: `kebab-case-co-robi.md`.
Szablon: project-structure/templates/runbook.md

| Runbook                | Co opisuje                                                            | Powstał w etapie |
| ---------------------- | --------------------------------------------------------------------- | ---------------- |
| -                      | -                                                                     | -                |
| `deploy-cloudflare.md` | Build, deploy, sekrety, weryfikacja i rollback Workera `app-10xcards` | F-02 (plan 0902) |
