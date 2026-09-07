import type { APIRoute } from "astro";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai";
import { createGeneration, GenerationError } from "@/lib/services/generation.service";
import { SOURCE_TEXT_MAX } from "@/types";

export const prerender = false;

const bodySchema = z.object({ text: z.string().max(SOURCE_TEXT_MAX * 4) });

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** POST /api/generations { text } -> 201 { generation, candidates } */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;
  if (!user || !supabase) return json({ error: "Wymagane logowanie" }, 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Nieprawidłowe żądanie", reason: "bad_request" }, 400);

  try {
    const created = await createGeneration(supabase, user.id, parsed.data.text, getAiProvider());
    return json(created, 201);
  } catch (error) {
    if (error instanceof GenerationError) {
      return json({ error: error.message, reason: error.code }, error.status);
    }
    throw error;
  }
};
