import { expect, test, type Browser, type Page } from "@playwright/test";

// S-02 (FR-013..FR-016, US-007, US-008) i IDOR na poziomie API (US-009, R3).
// Wymaga hostowanego Supabase; pomijany bez SUPABASE_URL / SUPABASE_KEY.
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

const TEXT = Array.from(
  { length: 3 },
  () =>
    "Vertical slice przechodzi przez wszystkie warstwy aplikacji i kończy się czymś, co użytkownik widzi. " +
    "Horizontal slicing daje pozorny postęp bez działającej funkcji i słaby sygnał jakości dla agenta. " +
    "Foundation musi wskazywać slice, który odblokowuje, inaczej jest horizontal driftem przebranym za fundament. " +
    "North star to najmniejszy przepływ dowodzący tezy produktu i filtr priorytetów przy równorzędnych zadaniach. " +
    "Roadmapa nie zawiera estymat czasu, bo praca z agentem jest nieliniowa i estymaty dawałyby fałszywe poczucie kontroli. ",
).join("");

async function signUp(page: Page, tag: string): Promise<void> {
  const stamp = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
  const password = `Pw-${stamp}-x`;
  await page.goto("/auth/signup");
  await page.getByLabel("Email").fill(`e2e-${tag}-${stamp}@example.com`);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByLabel("Powtórz hasło").fill(password);
  await page.getByRole("button", { name: "Załóż konto" }).click();
  await expect(page).toHaveURL(/\/generate$/);
}

/** Generuje na mocku i zapisuje pierwsze dwa kandydaty; zwraca strone na /deck. */
async function seedTwoCards(page: Page): Promise<void> {
  await page.getByTestId("source-text").fill(TEXT);
  await page.getByTestId("generate").click();
  const candidates = page.getByTestId("candidate");
  await expect(candidates).toHaveCount(5);
  await candidates.nth(0).getByTestId("accept").click();
  await candidates.nth(1).getByTestId("accept").click();
  await page.getByTestId("save-to-deck").click();
  await expect(page).toHaveURL(/\/deck\?saved=/);
  await expect(page.getByTestId("flashcard")).toHaveCount(2);
}

test.describe("deck edit and delete (S-02)", () => {
  test.skip(!hasSupabase, "SUPABASE_URL / SUPABASE_KEY not set");

  test("edits a card persistently and deletes another after confirmation", async ({ page }) => {
    await signUp(page, "deck");
    await seedTwoCards(page);

    const cards = page.getByTestId("flashcard");
    const secondFront = (await cards.nth(1).getByTestId("flashcard-front").textContent())?.trim();

    // Edycja pierwszej fiszki (FR-014, US-007).
    await cards.nth(0).getByTestId("card-edit").click();
    await cards.nth(0).getByTestId("card-edit-front").fill("Przód po edycji w decku");
    await cards.nth(0).getByTestId("card-edit-back").fill("Tył po edycji w decku");
    await cards.nth(0).getByTestId("card-save").click();
    await expect(cards.nth(0).getByTestId("flashcard-front")).toHaveText("Przód po edycji w decku");

    await page.reload();
    await expect(page.getByTestId("flashcard")).toHaveCount(2);
    const edited = page.getByTestId("flashcard").filter({ hasText: "Przód po edycji w decku" });
    await expect(edited.getByTestId("flashcard-back")).toHaveText("Tył po edycji w decku");

    // Usuniecie drugiej fiszki z potwierdzeniem (FR-015, US-008).
    const second = page.getByTestId("flashcard").filter({ hasText: secondFront ?? "" });
    await second.getByTestId("card-delete").click();
    await second.getByTestId("card-confirm-delete").click();
    await expect(page.getByTestId("flashcard")).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId("flashcard")).toHaveCount(1);
    const fronts = (await page.getByTestId("flashcard-front").allTextContents()).map((t) => t.trim());
    expect(fronts).not.toContain(secondFront);
  });

  test("another user gets 404 on PATCH and DELETE of a foreign card (US-009)", async ({ page, browser }) => {
    await signUp(page, "owner");
    await seedTwoCards(page);
    const cardId = await page.getByTestId("flashcard").nth(0).getAttribute("data-id");
    expect(cardId).toBeTruthy();

    const intruder = await signUpInNewContext(browser, "intruder");
    // Naglowek Origin jak z przegladarki: bez niego Astro odrzuca zadanie (403, CSRF).
    const headers = { Origin: new URL(intruder.url()).origin };
    const patch = await intruder.request.patch(`/api/flashcards/${String(cardId)}`, {
      headers,
      data: { front: "Przejęta", back: "Przejęta" },
    });
    expect(patch.status()).toBe(404);
    const del = await intruder.request.delete(`/api/flashcards/${String(cardId)}`, { headers });
    expect(del.status()).toBe(404);
    await intruder.context().close();

    // Wlasciciel nadal widzi swoja fiszke bez zmian.
    await page.reload();
    await expect(page.getByTestId("flashcard")).toHaveCount(2);
    await expect(page.getByTestId("flashcard-front").nth(0)).not.toHaveText("Przejęta");
  });
});

async function signUpInNewContext(browser: Browser, tag: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUp(page, tag);
  return page;
}
