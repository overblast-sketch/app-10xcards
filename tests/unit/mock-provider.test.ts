import { describe, expect, it } from "vitest";
import { MockProvider, MOCK_CANDIDATE_COUNT } from "@/lib/ai/mock-provider";

const paragraph =
  "Vertical slice przechodzi przez wszystkie warstwy aplikacji. " +
  "Horizontal slicing daje pozorny postęp bez działającej funkcji. " +
  "Foundation musi wskazywać slice, który odblokowuje. " +
  "North star to najmniejszy przepływ dowodzący tezy produktu. " +
  "Roadmapa nie zawiera estymat czasu, bo praca z agentem jest nieliniowa. " +
  "Szósta linia istnieje po to, żeby sprawdzić limit pięciu kandydatów.";

describe("MockProvider", () => {
  it("returns exactly five candidates for a text with at least five sentences", async () => {
    const result = await new MockProvider().generateCandidates(paragraph);
    expect(result).toHaveLength(MOCK_CANDIDATE_COUNT);
    expect(result[0]?.back).toBe("Vertical slice przechodzi przez wszystkie warstwy aplikacji.");
    expect(result[0]?.front).toContain("Vertical slice przechodzi przez wszystkie warstwy");
  });

  it("is deterministic", async () => {
    const p = new MockProvider();
    expect(await p.generateCandidates(paragraph)).toEqual(await p.generateCandidates(paragraph));
  });

  it("rejects with empty for text without sentences", async () => {
    await expect(new MockProvider().generateCandidates("a b c")).rejects.toMatchObject({ code: "empty" });
  });
});
