import type { CandidateDraft } from "@/types";
import { AiProviderError, normalizeCandidates, type AiProvider } from "@/lib/ai/provider";

export const MOCK_CANDIDATE_COUNT = 5;

/**
 * Deterministyczny dostawca do testow i pracy bez sieci: bierze pierwsze
 * zdania tekstu i robi z nich kandydatow "pytanie o poczatek zdania / zdanie".
 * Dla tekstu z co najmniej 5 zdaniami zwraca dokladnie 5 kandydatow (kontrakt e2e).
 */
export class MockProvider implements AiProvider {
  readonly name = "mock";
  readonly model = "mock-v1";

  generateCandidates(text: string): Promise<CandidateDraft[]> {
    const sentences = splitSentences(text).slice(0, MOCK_CANDIDATE_COUNT);
    const candidates = normalizeCandidates(
      sentences.map((sentence, index) => ({
        front: `${String(index + 1)}. Co mówi tekst o: „${leadWords(sentence, 6)}"?`,
        back: sentence,
      })),
    );
    if (candidates.length === 0) {
      return Promise.reject(new AiProviderError("empty", "Mock provider found no sentences in the text"));
    }
    return Promise.resolve(candidates);
  }
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);
}

function leadWords(sentence: string, count: number): string {
  return sentence
    .replace(/[.!?]+$/, "")
    .split(" ")
    .slice(0, count)
    .join(" ");
}
