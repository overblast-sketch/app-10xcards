# Deployment

- `deploy-plan.md` - fazowy, stanowy (checkboxy) plan wdrożenia; powstaje z
  `decisions/infrastructure.md` w trybie planowania (read-only), wykonywany faza po fazie.
  Szablon: project-structure/templates/deploy-plan.md
- Konfiguracja wdrożeniowa (workflow, manifesty) trzymana tutaj lub w katalogach
  narzędzi (`.forgejo/workflows/`), z odnośnikiem stąd.

Zasady:
- sekrety wyłącznie w env / secret managerze platformy; do aplikacji klucze o
  najwęższym zakresie (nigdy klucz typu service-role/admin),
- weryfikacja wdrożenia przez logi/health-check, nie przez sam brak błędu deploya,
- akcje nieodwracalne (drop bazy, rotacja sekretów, usunięcie projektu) tylko
  po jawnej zgodzie człowieka.
