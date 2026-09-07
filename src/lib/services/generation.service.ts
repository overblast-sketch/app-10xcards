import { AiProviderError, type AiProvider } from "@/lib/ai/provider";
import type { AppSupabaseClient } from "@/lib/supabase";
import { validateSourceText } from "@/lib/services/validate-source-text";
import type { Flashcard, FlashcardCandidate, Generation, SaveDecision, SaveGenerationResult } from "@/types";

export class GenerationError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "GenerationError";
    this.status = status;
    this.code = code;
  }
}

export interface CreatedGeneration {
  generation: Generation;
  candidates: FlashcardCandidate[];
}

/**
 * FR-005..FR-007: waliduje tekst, tworzy generacje `draft`, wola dostawce AI,
 * zapisuje kandydatow `pending`. Blad dostawcy zostawia generacje `failed`
 * z komunikatem (dowod dla FR-012/statystyk i debugowania), a tekst wraca
 * do uzytkownika w UI (formularz go nie czysci).
 */
export async function createGeneration(
  supabase: AppSupabaseClient,
  userId: string,
  sourceText: string,
  provider: AiProvider,
): Promise<CreatedGeneration> {
  const validation = validateSourceText(sourceText);
  if (!validation.ok) {
    throw new GenerationError(400, validation.reason, "Tekst źródłowy poza limitem 1 000 - 10 000 znaków");
  }
  const text = sourceText.trim();

  const { data: generation, error: insertError } = await supabase
    .from("generations")
    .insert({ user_id: userId, source_text: text, source_length: validation.length, model: provider.model })
    .select()
    .single();
  if (insertError) {
    throw new GenerationError(500, "db_insert", insertError.message);
  }

  let drafts;
  try {
    drafts = await provider.generateCandidates(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown provider error";
    await supabase.from("generations").update({ status: "failed", error_message: message }).eq("id", generation.id);
    const code = error instanceof AiProviderError ? error.code : "provider";
    throw new GenerationError(502, code, "Generowanie nie powiodło się. Spróbuj ponownie.");
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("flashcard_candidates")
    .insert(
      drafts.map((draft, position) => ({
        generation_id: generation.id,
        user_id: userId,
        front: draft.front,
        back: draft.back,
        position,
      })),
    )
    .select()
    .order("position");
  if (candidatesError) {
    await supabase
      .from("generations")
      .update({ status: "failed", error_message: candidatesError.message })
      .eq("id", generation.id);
    throw new GenerationError(500, "db_insert", candidatesError.message);
  }

  const { data: updated } = await supabase
    .from("generations")
    .update({ generated_count: candidates.length })
    .eq("id", generation.id)
    .select()
    .single();

  return { generation: updated ?? { ...generation, generated_count: candidates.length }, candidates };
}

/** FR-009..FR-012: atomowy zapis przez RPC save_generation (tech-stack D3). */
export async function saveGeneration(
  supabase: AppSupabaseClient,
  generationId: string,
  decisions: SaveDecision[],
): Promise<SaveGenerationResult> {
  const { data, error } = await supabase.rpc("save_generation", {
    p_generation_id: generationId,
    p_decisions: decisions,
  });
  if (error) {
    if (error.code === "P0002") throw new GenerationError(404, "not_found", "Generacja nie istnieje");
    if (error.message.includes("already"))
      throw new GenerationError(409, "already_saved", "Generacja jest już zapisana");
    throw new GenerationError(500, "rpc", error.message);
  }
  return data as unknown as SaveGenerationResult;
}

export async function getGeneration(supabase: AppSupabaseClient, generationId: string): Promise<Generation | null> {
  const { data } = await supabase.from("generations").select().eq("id", generationId).maybeSingle();
  return data;
}

/** FR-013: deck uzytkownika, najnowsze na gorze (RLS ogranicza do wlasciciela). */
export async function listFlashcards(supabase: AppSupabaseClient): Promise<Flashcard[]> {
  const { data, error } = await supabase.from("flashcards").select().order("created_at", { ascending: false });
  if (error) throw new GenerationError(500, "db_select", error.message);
  return data;
}
