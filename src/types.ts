/**
 * Typy domenowe i DTO aplikacji (konwencja startera: encje i DTO w src/types.ts).
 * Nazwy tabel i kolumn sa kontraktem z plans/0901-bootstrap-auth-schema/plan.md
 * (faza 3) i migracji supabase/migrations/20260907090000_initial_schema.sql.
 * Typy bazy generowane komenda `supabase gen types` trafia do src/db/types.ts.
 */

export const SOURCE_TEXT_MIN = 1000;
export const SOURCE_TEXT_MAX = 10000;
export const FRONT_MAX = 200;
export const BACK_MAX = 500;

export type GenerationStatus = "draft" | "saved" | "failed";
export type CandidateState = "pending" | "accepted" | "edited" | "rejected";

export interface Generation {
  id: string;
  user_id: string;
  source_text: string;
  source_length: number;
  model: string;
  status: GenerationStatus;
  generated_count: number;
  accepted_count: number;
  edited_count: number;
  rejected_count: number;
  error_message: string | null;
  created_at: string;
  saved_at: string | null;
}

export interface FlashcardCandidate {
  id: string;
  generation_id: string;
  user_id: string;
  front: string;
  back: string;
  edited_front: string | null;
  edited_back: string | null;
  state: CandidateState;
  position: number;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  front: string;
  back: string;
  source_generation_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Kandydat zwracany przez dostawce AI, przed zapisem do bazy. */
export interface CandidateDraft {
  front: string;
  back: string;
}

/** Decyzja uzytkownika o jednym kandydacie; element tablicy p_decisions w RPC save_generation. */
export type SaveDecision =
  | { candidate_id: string; state: "accepted" | "rejected" | "pending" }
  | { candidate_id: string; state: "edited"; front: string; back: string };

/** Wynik RPC save_generation. */
export interface SaveGenerationResult {
  generation_id: string;
  generated: number;
  accepted: number;
  edited: number;
  rejected: number;
  saved: number;
}
