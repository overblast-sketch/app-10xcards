import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/db/types";

// Ryzyko R2 (FR-009, US-006): zapis generacji jest atomowy. Jedna niepoprawna
// decyzja (obcy candidate_id) cofa cala transakcje: zero fiszek, generacja
// nadal `draft`. Prawdziwy, hostowany Supabase; pomijany bez SUPABASE_*.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
const enabled = Boolean(url && key);

type Client = SupabaseClient<Database>;

const SOURCE = "Zdanie testowe numer jeden o vertical slice. ".repeat(30);

describe.skipIf(!enabled)("save_generation atomicity (R2)", () => {
  let client: Client;
  let userId: string;
  let generationId: string;
  let candidateIds: string[];

  beforeAll(async () => {
    client = createClient<Database>(url ?? "", key ?? "", { auth: { persistSession: false } });
    const stamp = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
    const { data: auth, error: authError } = await client.auth.signUp({
      email: `atomic-${stamp}@example.com`,
      password: `Pw-${stamp}-x`,
    });
    if (authError || !auth.user) throw new Error(authError?.message ?? "no user");
    userId = auth.user.id;

    const { data: gen, error: genError } = await client
      .from("generations")
      .insert({ user_id: userId, source_text: SOURCE, source_length: SOURCE.length, model: "test" })
      .select()
      .single();
    if (genError) throw genError;
    generationId = gen.id;

    const { data: cands, error: candError } = await client
      .from("flashcard_candidates")
      .insert(
        [0, 1, 2].map((i) => ({
          generation_id: generationId,
          user_id: userId,
          front: `Q${String(i)}`,
          back: `A${String(i)}`,
          position: i,
        })),
      )
      .select("id, position");
    if (candError) throw candError;
    candidateIds = [...cands].sort((a, b) => a.position - b.position).map((c) => c.id);
  });

  it("rolls back everything when one decision points at a foreign candidate", async () => {
    const { error } = await client.rpc("save_generation", {
      p_generation_id: generationId,
      p_decisions: [
        { candidate_id: candidateIds[0], state: "accepted" },
        { candidate_id: "00000000-0000-0000-0000-000000000000", state: "accepted" },
      ],
    });
    expect(error).not.toBeNull();

    const { data: cards } = await client.from("flashcards").select("id").eq("source_generation_id", generationId);
    expect(cards).toEqual([]);
    const { data: gen } = await client
      .from("generations")
      .select("status, accepted_count")
      .eq("id", generationId)
      .single();
    expect(gen).toEqual({ status: "draft", accepted_count: 0 });
    const { data: first } = await client
      .from("flashcard_candidates")
      .select("state")
      .eq("id", candidateIds[0])
      .single();
    expect(first?.state).toBe("pending");
  });

  it("saves accepted and edited cards in one go and closes the generation", async () => {
    const { data, error } = await client.rpc("save_generation", {
      p_generation_id: generationId,
      p_decisions: [
        { candidate_id: candidateIds[0], state: "accepted" },
        { candidate_id: candidateIds[1], state: "edited", front: "Q1 edited", back: "A1 edited" },
        { candidate_id: candidateIds[2], state: "rejected" },
      ],
    });
    expect(error).toBeNull();
    expect(data).toMatchObject({ generated: 3, accepted: 1, edited: 1, rejected: 1, saved: 2 });

    const { data: cards } = await client
      .from("flashcards")
      .select("front")
      .eq("source_generation_id", generationId)
      .order("front");
    expect(cards?.map((c) => c.front)).toEqual(["Q0", "Q1 edited"]);

    const { error: again } = await client.rpc("save_generation", { p_generation_id: generationId, p_decisions: [] });
    expect(again?.message).toContain("already");
  });
});
