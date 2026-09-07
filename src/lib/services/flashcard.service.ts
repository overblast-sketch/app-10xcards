import type { AppSupabaseClient } from "@/lib/supabase";
import { GenerationError, logDbError } from "@/lib/services/generation.service";
import type { Flashcard } from "@/types";

/**
 * FR-014, FR-015: edycja i usuwanie fiszek w decku. RLS ogranicza zapytania
 * do wlasciciela, wiec cudza fiszka objawia sie jako "0 wierszy" i wraca
 * jako 404, bez rozroznienia "nie istnieje" od "nie twoja" (FR-004, US-009).
 */
export async function updateFlashcard(
  supabase: AppSupabaseClient,
  id: string,
  patch: { front: string; back: string },
): Promise<Flashcard> {
  const { data, error } = await supabase
    .from("flashcards")
    .update({ front: patch.front, back: patch.back })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    logDbError("flashcards.update", error);
    throw new GenerationError(500, "db_update", "Nie udało się zapisać zmian.");
  }
  if (!data) throw new GenerationError(404, "not_found", "Fiszka nie istnieje");
  return data;
}

export async function deleteFlashcard(supabase: AppSupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from("flashcards").delete().eq("id", id).select("id");
  if (error) {
    logDbError("flashcards.delete", error);
    throw new GenerationError(500, "db_delete", "Nie udało się usunąć fiszki.");
  }
  if (data.length === 0) throw new GenerationError(404, "not_found", "Fiszka nie istnieje");
}
