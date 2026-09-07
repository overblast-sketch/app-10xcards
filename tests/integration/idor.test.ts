import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/db/types";

// Ryzyko R3 (FR-004, US-009): wlasnosc egzekwowana na warstwie danych (RLS),
// nie tylko w UI. Prawdziwy, hostowany Supabase; dwoch swiezych uzytkownikow.
// Pomijany bez SUPABASE_URL / SUPABASE_KEY (vitest.config laduje .env).
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
const enabled = Boolean(url && key);

type Client = SupabaseClient<Database>;

async function freshUser(tag: string): Promise<{ client: Client; id: string }> {
  const client = createClient<Database>(url ?? "", key ?? "", { auth: { persistSession: false } });
  const stamp = `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await client.auth.signUp({
    email: `idor-${tag}-${stamp}@example.com`,
    password: `Pw-${stamp}-x`,
  });
  if (error || !data.user) throw new Error(`sign-up failed: ${error?.message ?? "no user"}`);
  return { client, id: data.user.id };
}

describe.skipIf(!enabled)("RLS ownership (R3)", () => {
  let a: { client: Client; id: string };
  let b: { client: Client; id: string };
  let cardId: string;

  beforeAll(async () => {
    a = await freshUser("a");
    b = await freshUser("b");
    // Fiszka powstaje wylacznie przez bramke (generacja -> kandydat -> save_generation).
    const source = "Zdanie o fiszce A, ktora nalezy do uzytkownika A. ".repeat(25);
    const { data: gen, error: genError } = await a.client
      .from("generations")
      .insert({ user_id: a.id, source_text: source, source_length: source.length, model: "test" })
      .select("id")
      .single();
    if (genError) throw genError;
    const { data: cand, error: candError } = await a.client
      .from("flashcard_candidates")
      .insert({ generation_id: gen.id, user_id: a.id, front: "Fiszka A", back: "Należy do A", position: 0 })
      .select("id")
      .single();
    if (candError) throw candError;
    const { error: rpcError } = await a.client.rpc("save_generation", {
      p_generation_id: gen.id,
      p_decisions: [{ candidate_id: cand.id, state: "accepted" }],
    });
    if (rpcError) throw rpcError;
    const { data, error } = await a.client.from("flashcards").select("id").eq("source_generation_id", gen.id).single();
    if (error) throw error;
    cardId = data.id;
  });

  it("nobody, not even the owner, inserts a flashcard directly (gate is the only path)", async () => {
    const { error } = await a.client.from("flashcards").insert({ user_id: a.id, front: "Obejście", back: "bramki" });
    expect(error).not.toBeNull();
  });

  it("owner cannot forge generation statistics outside the RPC", async () => {
    const { data: gen } = await a.client.from("generations").select("id").eq("user_id", a.id).limit(1).single();
    const { error } = await a.client
      .from("generations")
      .update({ accepted_count: 99 })
      .eq("id", gen?.id ?? "");
    expect(error).not.toBeNull();
  });

  it("owner reads their card", async () => {
    const { data } = await a.client.from("flashcards").select().eq("id", cardId);
    expect(data).toHaveLength(1);
  });

  it("another user cannot read the card by id", async () => {
    const { data, error } = await b.client.from("flashcards").select().eq("id", cardId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("another user cannot update the card (0 rows affected)", async () => {
    const { data } = await b.client.from("flashcards").update({ front: "Przejęta" }).eq("id", cardId).select();
    expect(data).toEqual([]);
    const { data: still } = await a.client.from("flashcards").select("front").eq("id", cardId).single();
    expect(still?.front).toBe("Fiszka A");
  });

  it("another user cannot delete the card (0 rows affected)", async () => {
    const { data } = await b.client.from("flashcards").delete().eq("id", cardId).select("id");
    expect(data).toEqual([]);
    const { data: still } = await a.client.from("flashcards").select("id").eq("id", cardId);
    expect(still).toHaveLength(1);
  });

  it("another user cannot insert a card on behalf of the owner", async () => {
    const { error } = await b.client.from("flashcards").insert({ user_id: a.id, front: "Podrzucona", back: "x" });
    expect(error).not.toBeNull();
  });
});
