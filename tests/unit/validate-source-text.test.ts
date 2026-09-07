import { describe, expect, it } from "vitest";
import { validateSourceText } from "@/lib/services/validate-source-text";

// Ryzyko R4 (test-plan): granice 1 000 - 10 000 z FR-005. Oczekiwane wyniki
// pochodza z PRD, nie z implementacji.
describe("validateSourceText (FR-005, R4)", () => {
  it("rejects 999 characters as too short", () => {
    expect(validateSourceText("a".repeat(999))).toEqual({ ok: false, reason: "too_short", length: 999 });
  });

  it("accepts exactly 1000 characters", () => {
    expect(validateSourceText("a".repeat(1000))).toEqual({ ok: true, length: 1000 });
  });

  it("accepts exactly 10000 characters", () => {
    expect(validateSourceText("a".repeat(10000))).toEqual({ ok: true, length: 10000 });
  });

  it("rejects 10001 characters as too long", () => {
    expect(validateSourceText("a".repeat(10001))).toEqual({ ok: false, reason: "too_long", length: 10001 });
  });

  it("ignores surrounding whitespace when counting", () => {
    expect(validateSourceText(`\n\n  ${"a".repeat(1000)}  \n`)).toEqual({ ok: true, length: 1000 });
  });

  it("counts a Polish letter as one character", () => {
    expect(validateSourceText("ł".repeat(1000))).toEqual({ ok: true, length: 1000 });
  });
});
