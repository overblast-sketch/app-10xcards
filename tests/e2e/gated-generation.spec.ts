import { expect, test, type Page } from "@playwright/test";

// Ryzyko R1 (test-plan) i test "z perspektywy uzytkownika" wymagany do
// certyfikacji: pelna petla S-01 na mocku AI (AI_PROVIDER=mock).
// Wyrocznia z PRD US-005: 5 kandydatow, 2 accept / 1 edit / 1 reject / 1 pending
// -> w decku dokladnie 3 fiszki, statystyka 5/2/1/1. Dodatkowo R4 (US-004):
// 300 znakow nie wywoluje generacji. Wymaga hostowanego Supabase (sesja).
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

const SENTENCES = [
  "Vertical slice przechodzi przez wszystkie warstwy aplikacji i kończy się czymś, co użytkownik widzi.",
  "Horizontal slicing daje pozorny postęp bez działającej funkcji i słaby sygnał jakości dla agenta.",
  "Foundation musi wskazywać slice, który odblokowuje, inaczej jest horizontal driftem przebranym za fundament.",
  "North star to najmniejszy przepływ dowodzący tezy produktu i filtr priorytetów przy równorzędnych zadaniach.",
  "Roadmapa nie zawiera estymat czasu, bo praca z agentem jest nieliniowa i estymaty dawałyby fałszywe poczucie kontroli.",
  "Streams to grupy równoległych strumieni pracy, istotne przy mocno rozgałęzionym grafie zależności.",
];
const LONG_TEXT = Array.from({ length: 3 }, () => SENTENCES.join(" ")).join(" ");
const SHORT_TEXT = "Ten tekst ma zdecydowanie mniej niż tysiąc znaków, więc generacja nie powinna ruszyć.";

async function signUp(page: Page): Promise<string> {
  const stamp = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e-gen-${stamp}@example.com`;
  const password = `Pw-${stamp}-x`;
  await page.goto("/auth/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByLabel("Powtórz hasło").fill(password);
  await page.getByRole("button", { name: "Załóż konto" }).click();
  await expect(page).toHaveURL(/\/generate$/);
  return email;
}

test.describe("gated generation loop (S-01, R1)", () => {
  test.skip(!hasSupabase, "SUPABASE_URL / SUPABASE_KEY not set");

  test("short text is rejected before any generation (FR-005, R4)", async ({ page }) => {
    await signUp(page);
    await page.getByTestId("source-text").fill(SHORT_TEXT);
    await page.getByTestId("generate").click();
    await expect(page.getByTestId("error")).toContainText("za krótki");
    await expect(page.getByTestId("candidate-list")).toHaveCount(0);
    // Tekst zostaje w formularzu (FR-007).
    await expect(page.getByTestId("source-text")).toHaveValue(SHORT_TEXT);
  });

  test("paste, generate, decide per candidate, save: only accepted cards reach the deck", async ({ page }) => {
    await signUp(page);
    expect(LONG_TEXT.length).toBeGreaterThanOrEqual(1000);

    await page.getByTestId("source-text").fill(LONG_TEXT);
    await page.getByTestId("generate").click();

    const candidates = page.getByTestId("candidate");
    await expect(candidates).toHaveCount(5);
    await expect(page.getByTestId("save-to-deck")).toBeDisabled();

    // 2 accept, 1 edit, 1 reject, 1 pending.
    await candidates.nth(0).getByTestId("accept").click();
    await candidates.nth(1).getByTestId("accept").click();
    await candidates.nth(2).getByTestId("edit").click();
    await candidates.nth(2).getByTestId("edit-front").fill("Poprawiony przód");
    await candidates.nth(2).getByTestId("edit-back").fill("Poprawiony tył po edycji");
    await candidates.nth(2).getByTestId("edit-save").click();
    await candidates.nth(3).getByTestId("reject").click();

    await expect(candidates.nth(2).getByTestId("candidate-front")).toHaveText("Poprawiony przód");
    await expect(page.getByTestId("review-summary")).toContainText(
      "zaakceptowanych: 2, po edycji: 1, odrzuconych: 1, do decyzji: 1",
    );
    const rejectedFront = (await candidates.nth(3).getByTestId("candidate-front").textContent())?.trim();
    const pendingFront = (await candidates.nth(4).getByTestId("candidate-front").textContent())?.trim();

    await expect(page.getByTestId("save-to-deck")).toHaveText(/Zapisz do decka \(3\)/);
    await page.getByTestId("save-to-deck").click();

    await expect(page).toHaveURL(/\/deck\?saved=/);
    await expect(page.getByTestId("generation-summary")).toContainText(
      "Wygenerowano 5, zaakceptowano 2, po edycji 1, odrzucono 1. Do decka trafiło 3 fiszek.",
    );

    const cards = page.getByTestId("flashcard");
    await expect(cards).toHaveCount(3);
    const fronts = (await cards.getByTestId("flashcard-front").allTextContents()).map((t) => t.trim());
    expect(fronts).toContain("Poprawiony przód");
    expect(fronts).not.toContain(rejectedFront);
    expect(fronts).not.toContain(pendingFront);
    await expect(cards.filter({ hasText: "Poprawiony przód" }).getByTestId("flashcard-back")).toHaveText(
      "Poprawiony tył po edycji",
    );

    // Odswiezenie: dane sa trwale, nie tylko w stanie przegladarki.
    await page.reload();
    await expect(page.getByTestId("flashcard")).toHaveCount(3);
  });
});
