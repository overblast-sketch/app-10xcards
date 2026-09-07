import type { APIRoute } from "astro";
import { z } from "zod";
import { GenerationError, saveGeneration } from "@/lib/services/generation.service";
import { BACK_MAX, FRONT_MAX } from "@/types";

export const prerender = false;

const decisionSchema = z.discriminatedUnion("state", [
  z.object({ candidate_id: z.uuid(), state: z.enum(["accepted", "rejected", "pending"]) }),
  z.object({
    candidate_id: z.uuid(),
    state: z.literal("edited"),
    front: z.string().trim().min(1).max(FRONT_MAX),
    back: z.string().trim().min(1).max(BACK_MAX),
  }),
]);

const bodySchema = z.object({ decisions: z.array(decisionSchema).max(100) });

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** POST /api/generations/:id/save { decisions } -> 200 SaveGenerationResult */
export const POST: APIRoute = async ({ request, locals, params }) => {
  const { user, supabase } = locals;
  if (!user || !supabase) return json({ error: "Wymagane logowanie" }, 401);

  const id = z.uuid().safeParse(params.id);
  if (!id.success) return json({ error: "Nieprawidłowy identyfikator", reason: "bad_request" }, 400);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Nieprawidłowe decyzje", reason: "bad_request" }, 400);

  try {
    const result = await saveGeneration(supabase, id.data, parsed.data.decisions);
    return json(result, 200);
  } catch (error) {
    if (error instanceof GenerationError) {
      return json({ error: error.message, reason: error.code }, error.status);
    }
    throw error;
  }
};
