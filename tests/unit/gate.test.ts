import { describe, expect, it } from "vitest";
import {
  applyDecisions,
  selectCardsToSave,
  summarizeDecisions,
  toSaveDecisions,
  type GateCandidate,
} from "@/lib/services/gate";

// Wyrocznia z PRD US-005 (ryzyka R1 i R7): 5 kandydatow, decyzje
// 2 accepted, 1 edited, 1 rejected, 1 pending -> 3 fiszki, statystyka 5/2/1/1.
function candidate(n: number): GateCandidate {
  return {
    id: `c${String(n)}`,
    front: `Q${String(n)}`,
    back: `A${String(n)}`,
    state: "pending",
    editedFront: null,
    editedBack: null,
  };
}

const five = [1, 2, 3, 4, 5].map(candidate);

const decided = applyDecisions(five, [
  { candidate_id: "c1", state: "accepted" },
  { candidate_id: "c2", state: "accepted" },
  { candidate_id: "c3", state: "edited", front: "Q3 poprawione", back: "A3 poprawione" },
  { candidate_id: "c4", state: "rejected" },
]);

describe("acceptance gate (FR-008..FR-011, R1)", () => {
  it("saves exactly the accepted and edited candidates, with edited text", () => {
    expect(selectCardsToSave(decided)).toEqual([
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2" },
      { front: "Q3 poprawione", back: "A3 poprawione" },
    ]);
  });

  it("never saves rejected or pending candidates", () => {
    const fronts = selectCardsToSave(decided).map((c) => c.front);
    expect(fronts).not.toContain("Q4");
    expect(fronts).not.toContain("Q5");
  });

  it("saves nothing when no decision was made", () => {
    expect(selectCardsToSave(five)).toEqual([]);
  });

  it("lets a later decision override an earlier one (accept then reject)", () => {
    const flipped = applyDecisions(decided, [{ candidate_id: "c1", state: "rejected" }]);
    expect(selectCardsToSave(flipped).map((c) => c.front)).toEqual(["Q2", "Q3 poprawione"]);
  });

  it("drops edited text when the candidate is re-decided as plain accepted", () => {
    const back = applyDecisions(decided, [{ candidate_id: "c3", state: "accepted" }]);
    expect(selectCardsToSave(back).map((c) => c.front)).toEqual(["Q1", "Q2", "Q3"]);
  });
});

describe("generation statistics (FR-012, R7)", () => {
  it("counts 5 generated, 2 accepted, 1 edited, 1 rejected, 1 pending", () => {
    expect(summarizeDecisions(decided)).toEqual({ generated: 5, accepted: 2, edited: 1, rejected: 1, pending: 1 });
  });

  it("serialises only decided candidates for the save RPC", () => {
    expect(toSaveDecisions(decided)).toEqual([
      { candidate_id: "c1", state: "accepted" },
      { candidate_id: "c2", state: "accepted" },
      { candidate_id: "c3", state: "edited", front: "Q3 poprawione", back: "A3 poprawione" },
      { candidate_id: "c4", state: "rejected" },
    ]);
  });
});
