-- app-10xcards: initial schema (plan 0901, faza 3)
-- Model danych wg context/foundation/prd.md. Kazda tabela ma RLS z politykami
-- per operacja: wlasciciel (auth.uid() = user_id) i nikt inny (FR-004).

create type public.generation_status as enum ('draft', 'saved', 'failed');
create type public.candidate_state as enum ('pending', 'accepted', 'edited', 'rejected');

-- ---------------------------------------------------------------------------
-- generations: jedna generacja = jeden wklejony tekst + statystyka decyzji
-- ---------------------------------------------------------------------------
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_text text not null check (char_length(source_text) between 1000 and 10000),
  source_length integer not null check (source_length between 1000 and 10000),
  model text not null,
  status public.generation_status not null default 'draft',
  generated_count integer not null default 0 check (generated_count >= 0),
  accepted_count integer not null default 0 check (accepted_count >= 0),
  edited_count integer not null default 0 check (edited_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  saved_at timestamptz
);

create index generations_user_created_idx on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

create policy "generations_select_own" on public.generations
  for select to authenticated using (auth.uid() = user_id);
create policy "generations_insert_own" on public.generations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "generations_update_own" on public.generations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "generations_delete_own" on public.generations
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- flashcard_candidates: propozycje AI, nigdy nie sa fiszkami same z siebie
-- ---------------------------------------------------------------------------
create table public.flashcard_candidates (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  front text not null check (char_length(front) between 1 and 200),
  back text not null check (char_length(back) between 1 and 500),
  edited_front text check (edited_front is null or char_length(edited_front) between 1 and 200),
  edited_back text check (edited_back is null or char_length(edited_back) between 1 and 500),
  state public.candidate_state not null default 'pending',
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (generation_id, position)
);

create index flashcard_candidates_generation_idx on public.flashcard_candidates (generation_id, position);

alter table public.flashcard_candidates enable row level security;

create policy "candidates_select_own" on public.flashcard_candidates
  for select to authenticated using (auth.uid() = user_id);
create policy "candidates_insert_own" on public.flashcard_candidates
  for insert to authenticated with check (auth.uid() = user_id);
create policy "candidates_update_own" on public.flashcard_candidates
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "candidates_delete_own" on public.flashcard_candidates
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- flashcards: deck uzytkownika; powstaja wylacznie przez save_generation
-- (tech-stack D3) albo edycje w decku (S-02)
-- ---------------------------------------------------------------------------
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  front text not null check (char_length(front) between 1 and 200),
  back text not null check (char_length(back) between 1 and 500),
  source_generation_id uuid references public.generations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index flashcards_user_created_idx on public.flashcards (user_id, created_at desc);

alter table public.flashcards enable row level security;

create policy "flashcards_select_own" on public.flashcards
  for select to authenticated using (auth.uid() = user_id);
create policy "flashcards_insert_own" on public.flashcards
  for insert to authenticated with check (auth.uid() = user_id);
create policy "flashcards_update_own" on public.flashcards
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "flashcards_delete_own" on public.flashcards
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger flashcards_set_updated_at
  before update on public.flashcards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- save_generation: bramka akceptacji + atomowy zapis (FR-008..FR-012, D3)
--
-- p_decisions: jsonb array elementow
--   { "candidate_id": uuid, "state": "accepted"|"edited"|"rejected"|"pending",
--     "front": text (wymagane przy edited), "back": text (wymagane przy edited) }
-- Kandydat pominiety w p_decisions zostaje 'pending'.
-- Cala funkcja wykonuje sie w jednej transakcji: kazdy blad cofa wszystko.
-- security invoker: polityki RLS wolajacego obowiazuja w srodku.
-- ---------------------------------------------------------------------------
create or replace function public.save_generation(p_generation_id uuid, p_decisions jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_generation public.generations%rowtype;
  v_decision jsonb;
  v_state text;
  v_candidate_id uuid;
  v_updated integer;
  v_generated integer;
  v_accepted integer;
  v_edited integer;
  v_rejected integer;
  v_saved integer;
begin
  if jsonb_typeof(p_decisions) <> 'array' then
    raise exception 'p_decisions must be a json array' using errcode = '22023';
  end if;

  select * into v_generation
  from public.generations
  where id = p_generation_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'generation not found' using errcode = 'P0002';
  end if;

  if v_generation.status <> 'draft' then
    raise exception 'generation already % ', v_generation.status using errcode = '22023';
  end if;

  for v_decision in select * from jsonb_array_elements(p_decisions) loop
    v_state := v_decision ->> 'state';
    v_candidate_id := (v_decision ->> 'candidate_id')::uuid;

    if v_state not in ('pending', 'accepted', 'edited', 'rejected') then
      raise exception 'invalid state %', v_state using errcode = '22023';
    end if;

    if v_state = 'edited' then
      update public.flashcard_candidates
      set state = 'edited',
          edited_front = v_decision ->> 'front',
          edited_back = v_decision ->> 'back'
      where id = v_candidate_id and generation_id = p_generation_id;
    else
      update public.flashcard_candidates
      set state = v_state::public.candidate_state,
          edited_front = null,
          edited_back = null
      where id = v_candidate_id and generation_id = p_generation_id;
    end if;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'candidate % not in generation', v_candidate_id using errcode = 'P0002';
    end if;
  end loop;

  select
    count(*),
    count(*) filter (where state = 'accepted'),
    count(*) filter (where state = 'edited'),
    count(*) filter (where state = 'rejected')
  into v_generated, v_accepted, v_edited, v_rejected
  from public.flashcard_candidates
  where generation_id = p_generation_id;

  insert into public.flashcards (user_id, front, back, source_generation_id)
  select user_id,
         coalesce(edited_front, front),
         coalesce(edited_back, back),
         generation_id
  from public.flashcard_candidates
  where generation_id = p_generation_id
    and state in ('accepted', 'edited')
  order by position;

  get diagnostics v_saved = row_count;

  update public.generations
  set status = 'saved',
      generated_count = v_generated,
      accepted_count = v_accepted,
      edited_count = v_edited,
      rejected_count = v_rejected,
      saved_at = now()
  where id = p_generation_id;

  return jsonb_build_object(
    'generation_id', p_generation_id,
    'generated', v_generated,
    'accepted', v_accepted,
    'edited', v_edited,
    'rejected', v_rejected,
    'saved', v_saved
  );
end;
$$;

revoke all on function public.save_generation(uuid, jsonb) from public;
grant execute on function public.save_generation(uuid, jsonb) to authenticated;
