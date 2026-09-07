-- app-10xcards: utwardzenie bramki akceptacji na warstwie danych
-- (review Codex 2026-09-07, findingi P1 #1 i #2; audits/review-code-2026-09-07.md)
--
-- 1. Fiszki powstaja WYLACZNIE przez save_generation (PRD: regula 1). Polityka
--    bezposredniego insertu do flashcards znika; RPC staje sie security definer
--    z jawnym sprawdzeniem wlasciciela, wiec wstawia fiszki mimo braku polityki.
-- 2. Liczniki i zamkniecie generacji zmienia tylko save_generation (PRD: regula 5).
--    Trigger blokuje zmiane accepted/edited/rejected_count, saved_at i przejscie
--    na status 'saved' poza RPC (RPC ustawia transakcyjny znacznik app.gate_bypass).
--    Aplikacja nadal moze oznaczyc generacje jako 'failed' i ustawic generated_count.

drop policy if exists "flashcards_insert_own" on public.flashcards;

create or replace function public.guard_generation_update()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.gate_bypass', true), '') = 'save_generation' then
    return new;
  end if;
  if new.accepted_count is distinct from old.accepted_count
     or new.edited_count is distinct from old.edited_count
     or new.rejected_count is distinct from old.rejected_count
     or new.saved_at is distinct from old.saved_at
     or (new.status = 'saved' and old.status is distinct from 'saved') then
    raise exception 'generation statistics and saved state change only through save_generation'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists generations_guard_update on public.generations;
create trigger generations_guard_update
  before update on public.generations
  for each row execute function public.guard_generation_update();

create or replace function public.save_generation(p_generation_id uuid, p_decisions jsonb)
returns jsonb
language plpgsql
security definer
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
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(p_decisions) <> 'array' then
    raise exception 'p_decisions must be a json array' using errcode = '22023';
  end if;

  -- security definer omija RLS, wiec wlasciciel jest sprawdzany jawnie.
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
      where id = v_candidate_id and generation_id = p_generation_id and user_id = auth.uid();
    else
      update public.flashcard_candidates
      set state = v_state::public.candidate_state,
          edited_front = null,
          edited_back = null
      where id = v_candidate_id and generation_id = p_generation_id and user_id = auth.uid();
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
    and user_id = auth.uid()
    and state in ('accepted', 'edited')
  order by position;

  get diagnostics v_saved = row_count;

  perform set_config('app.gate_bypass', 'save_generation', true);

  update public.generations
  set status = 'saved',
      generated_count = v_generated,
      accepted_count = v_accepted,
      edited_count = v_edited,
      rejected_count = v_rejected,
      saved_at = now()
  where id = p_generation_id;

  perform set_config('app.gate_bypass', '', true);

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
