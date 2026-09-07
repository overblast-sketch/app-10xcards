import type { CandidateDraft, CandidateState, SaveDecision } from "@/types";

/**
 * Bramka akceptacji (FR-008..FR-012) jako czyste funkcje, bez bazy i Astro.
 * Ta sama regula jest egzekwowana w RPC save_generation; tutaj sluzy UI
 * (podglad "Zapisz N fiszek") i testom unit (ryzyka R1, R7).
 */

export interface GateCandidate extends CandidateDraft {
  id: string;
  state: CandidateState;
  editedFront: string | null;
  editedBack: string | null;
}

export interface DecisionSummary {
  generated: number;
  accepted: number;
  edited: number;
  rejected: number;
  pending: number;
}

/** Naklada decyzje na kandydatow; kandydat bez decyzji zostaje bez zmian. */
export function applyDecisions(candidates: GateCandidate[], decisions: SaveDecision[]): GateCandidate[] {
  const byId = new Map(decisions.map((d) => [d.candidate_id, d]));
  return candidates.map((candidate) => {
    const decision = byId.get(candidate.id);
    if (!decision) return candidate;
    if (decision.state === "edited") {
      return { ...candidate, state: "edited", editedFront: decision.front, editedBack: decision.back };
    }
    return { ...candidate, state: decision.state, editedFront: null, editedBack: null };
  });
}

/** Fiszki, ktore trafia do decka: wylacznie accepted i edited, z trescia po edycji. */
export function selectCardsToSave(candidates: GateCandidate[]): CandidateDraft[] {
  return candidates
    .filter((c) => c.state === "accepted" || c.state === "edited")
    .map((c) => ({
      front: c.state === "edited" && c.editedFront ? c.editedFront : c.front,
      back: c.state === "edited" && c.editedBack ? c.editedBack : c.back,
    }));
}

export function summarizeDecisions(candidates: GateCandidate[]): DecisionSummary {
  const summary: DecisionSummary = { generated: candidates.length, accepted: 0, edited: 0, rejected: 0, pending: 0 };
  for (const c of candidates) summary[c.state] += 1;
  return summary;
}

/** Decyzje do wyslania w save: kazdy kandydat z rozstrzygnietym stanem. */
export function toSaveDecisions(candidates: GateCandidate[]): SaveDecision[] {
  return candidates
    .filter((c) => c.state !== "pending")
    .map((c) =>
      c.state === "edited"
        ? { candidate_id: c.id, state: "edited", front: c.editedFront ?? c.front, back: c.editedBack ?? c.back }
        : { candidate_id: c.id, state: c.state },
    );
}
