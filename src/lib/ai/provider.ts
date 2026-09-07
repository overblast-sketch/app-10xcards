import { z } from "zod";
import { BACK_MAX, FRONT_MAX, type CandidateDraft } from "@/types";

export type AiProviderErrorCode = "timeout" | "http" | "invalid_response" | "empty" | "not_configured";

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode;
  readonly status?: number;

  constructor(code: AiProviderErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
    this.status = status;
  }
}

/** Dostawca kandydatow na fiszki. Implementacje: MockProvider, OpenRouterProvider. */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  generateCandidates(text: string): Promise<CandidateDraft[]>;
}

export const candidateDraftSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const candidateListSchema = z.object({
  flashcards: z.array(candidateDraftSchema),
});

/**
 * Sprowadza surowe kandydaty do kontraktu PRD (FR-016): przycina biale znaki,
 * tnie do limitow 200/500 znakow, odrzuca puste. Kolejnosc zachowana.
 */
export function normalizeCandidates(raw: CandidateDraft[]): CandidateDraft[] {
  return raw
    .map((c) => ({
      front: truncate(c.front.trim(), FRONT_MAX),
      back: truncate(c.back.trim(), BACK_MAX),
    }))
    .filter((c) => c.front.length > 0 && c.back.length > 0);
}

function truncate(value: string, max: number): string {
  const chars = Array.from(value);
  return chars.length <= max ? value : chars.slice(0, max).join("");
}
