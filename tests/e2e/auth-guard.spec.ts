import { expect, test } from "@playwright/test";

// Ryzyko R6 (test-plan): trasy produktu bez sesji koncza sie na /auth/signin (FR-003, US-002).
test.describe("auth guard", () => {
  for (const path of ["/generate", "/deck"]) {
    test(`redirects anonymous visitor from ${path} to sign-in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/signin$/);
      await expect(page.getByRole("heading", { name: "Zaloguj się" })).toBeVisible();
    });
  }

  test("product API returns 401 JSON without a session", async ({ request }) => {
    const response = await request.get("/api/generations");
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Wymagane logowanie" });
  });

  test("landing page is public and links to sign-up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "10xCards" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Załóż konto" }).first()).toBeVisible();
  });
});
