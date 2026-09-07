import { describe, expect, it, vi } from "vitest";
import { OpenRouterProvider, parseJsonLoosely } from "@/lib/ai/openrouter-provider";
import { AiProviderError } from "@/lib/ai/provider";

// Ryzyko R5 (FR-007): dostawca zwraca nie-JSON, 429, timeout albo pusta liste.
const okBody = (content: string) => ({ choices: [{ message: { content } }] });
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function provider(fetchImpl: typeof fetch, timeoutMs = 1000) {
  return new OpenRouterProvider({ apiKey: "sk-or-v1-test", model: "test/model", fetchImpl, timeoutMs });
}

describe("OpenRouterProvider (R5)", () => {
  it("returns normalized candidates from a JSON reply", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(okBody(JSON.stringify({ flashcards: [{ front: "  Co to RLS? ", back: "Row Level Security." }] }))),
      );
    const result = await provider(fetchImpl).generateCandidates("tekst");
    expect(result).toEqual([{ front: "Co to RLS?", back: "Row Level Security." }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("extracts JSON wrapped in markdown fences", async () => {
    const content = '```json\n{"flashcards":[{"front":"Q","back":"A"}]}\n```';
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(okBody(content)));
    expect(await provider(fetchImpl).generateCandidates("tekst")).toEqual([{ front: "Q", back: "A" }]);
  });

  it("fails with invalid_response when the reply is not a flashcard list", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(okBody("Oto Twoje fiszki: 1) ...")));
    await expect(provider(fetchImpl).generateCandidates("tekst")).rejects.toMatchObject({
      name: "AiProviderError",
      code: "invalid_response",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries once after HTTP 429 and succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, 429))
      .mockResolvedValueOnce(jsonResponse(okBody(JSON.stringify({ flashcards: [{ front: "Q", back: "A" }] }))));
    expect(await provider(fetchImpl).generateCandidates("tekst")).toEqual([{ front: "Q", back: "A" }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry on HTTP 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));
    await expect(provider(fetchImpl).generateCandidates("tekst")).rejects.toMatchObject({ code: "http", status: 401 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("times out, retries once, then fails with timeout", async () => {
    const fetchImpl = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    await expect(provider(fetchImpl, 20).generateCandidates("tekst")).rejects.toMatchObject({ code: "timeout" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails with empty when every candidate is blank", async () => {
    // Nowy Response na kazde wywolanie: cialo odpowiedzi da sie odczytac tylko raz.
    const fetchImpl = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse(okBody(JSON.stringify({ flashcards: [{ front: " ", back: "" }] })))),
      );
    const error = await provider(fetchImpl)
      .generateCandidates("tekst")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiProviderError);
    expect(error).toMatchObject({ code: "empty" });
  });

  it("refuses to start without key or model", () => {
    expect(() => new OpenRouterProvider({ apiKey: "", model: "m" })).toThrow(AiProviderError);
  });
});

describe("parseJsonLoosely", () => {
  it("returns null for content without a JSON object", () => {
    expect(parseJsonLoosely("no json here")).toBeNull();
  });
});
