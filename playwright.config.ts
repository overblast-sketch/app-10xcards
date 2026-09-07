import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

// E2E zawsze na mocku AI (tech-stack D4, D6); Supabase moze byc nieskonfigurowany
// dla testow, ktore nie loguja uzytkownika.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx astro dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AI_PROVIDER: "mock" },
  },
});
