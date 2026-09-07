import { expect, test } from "@playwright/test";

// FR-001, FR-002, US-001: rejestracja i logowanie na prawdziwym Supabase.
// Wymaga SUPABASE_URL i SUPABASE_KEY w srodowisku serwera (astro dev czyta .env);
// bez nich test jest pomijany, zeby CI bez sekretow nie padal.
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

test.describe("sign-up and sign-in on Supabase", () => {
  test.skip(!hasSupabase, "SUPABASE_URL / SUPABASE_KEY not set");

  const email = `e2e-${Date.now()}@example.com`;
  const password = `Pw-${Date.now()}-x`;

  test("new user signs up, lands on /generate, signs out and signs back in", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Hasło", { exact: true }).fill(password);
    await page.getByLabel("Powtórz hasło").fill(password);
    await page.getByRole("button", { name: "Załóż konto" }).click();

    await expect(page).toHaveURL(/\/generate$/);
    await expect(page.getByTestId("user-email")).toHaveText(email);

    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Hasło", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    await expect(page).toHaveURL(/\/generate$/);
    await expect(page.getByTestId("page-title")).toHaveText("Generuj fiszki");
  });
});
