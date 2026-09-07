import type { APIRoute } from "astro";
import { z } from "zod";
import { GenerationError } from "@/lib/services/generation.service";
import { deleteFlashcard, updateFlashcard } from "@/lib/services/flashcard.service";
import { BACK_MAX, FRONT_MAX } from "@/types";

export const prerender = false;

const patchSchema = z.object({
  front: z.string().trim().min(1).max(FRONT_MAX),
  back: z.string().trim().min(1).max(BACK_MAX),
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function handleError(error: unknown): Response {
  if (error instanceof GenerationError) return json({ error: error.message, reason: error.code }, error.status);
  throw error;
}

/** PATCH /api/flashcards/:id { front, back } -> 200 Flashcard (FR-014) */
export const PATCH: APIRoute = async ({ request, locals, params }) => {
  const { user, supabase } = locals;
  if (!user || !supabase) return json({ error: "Wymagane logowanie" }, 401);

  const id = z.uuid().safeParse(params.id);
  if (!id.success) return json({ error: "Nieprawidłowy identyfikator", reason: "bad_request" }, 400);

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: `Przód ma 1-${String(FRONT_MAX)} znaków, tył 1-${String(BACK_MAX)}`, reason: "bad_request" },
      400,
    );
  }

  try {
    return json(await updateFlashcard(supabase, id.data, parsed.data), 200);
  } catch (error) {
    return handleError(error);
  }
};

/** DELETE /api/flashcards/:id -> 204 (FR-015) */
export const DELETE: APIRoute = async ({ locals, params }) => {
  const { user, supabase } = locals;
  if (!user || !supabase) return json({ error: "Wymagane logowanie" }, 401);

  const id = z.uuid().safeParse(params.id);
  if (!id.success) return json({ error: "Nieprawidłowy identyfikator", reason: "bad_request" }, 400);

  try {
    await deleteFlashcard(supabase, id.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
};
