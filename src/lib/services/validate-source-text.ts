import { SOURCE_TEXT_MAX, SOURCE_TEXT_MIN } from "@/types";

export type SourceTextValidation =
  | { ok: true; length: number }
  | { ok: false; reason: "too_short" | "too_long"; length: number };

/**
 * FR-005: tekst zrodlowy ma 1 000 - 10 000 znakow (po przycieciu bialych znakow
 * na krancach). Liczymy znaki Unicode (code points), nie jednostki UTF-16, zeby
 * polskie znaki i emoji liczyly sie jak jeden znak dla uzytkownika.
 */
export function validateSourceText(text: string): SourceTextValidation {
  const length = Array.from(text.trim()).length;
  if (length < SOURCE_TEXT_MIN) {
    return { ok: false, reason: "too_short", length };
  }
  if (length > SOURCE_TEXT_MAX) {
    return { ok: false, reason: "too_long", length };
  }
  return { ok: true, length };
}

export function sourceTextErrorMessage(reason: "too_short" | "too_long"): string {
  return reason === "too_short"
    ? `Tekst jest za krótki: potrzeba co najmniej ${SOURCE_TEXT_MIN} znaków.`
    : `Tekst jest za długi: maksymalnie ${SOURCE_TEXT_MAX} znaków.`;
}
