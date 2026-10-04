-- Integrity constraints, atomic score updates, and finish_match that takes points from the app domain layer.

alter table public.matches
  add constraint matches_scores_nonneg check (a_score >= 0 and b_score >= 0),
  add constraint matches_target_range check (target between 1 and 10),
  add constraint matches_distinct_players check (a_id is null or b_id is null or a_id <> b_id);

create index if not exists players_points_idx on public.players (points desc);
create index if not exists matches_status_idx on public.matches (status, created_at desc);

-- The realtime scoreboard page was removed.
do $$ begin
  alter publication supabase_realtime drop table public.matches;
exception when others then null;
end $$;

create or replace function public.bump_score(p_match uuid, p_side text, p_delta int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_delta not in (-1, 1) then raise exception 'invalid delta'; end if;
  if p_side = 'a' then
    update public.matches set a_score = greatest(0, a_score + p_delta) where id = p_match and status = 'live';
  elsif p_side = 'b' then
    update public.matches set b_score = greatest(0, b_score + p_delta) where id = p_match and status = 'live';
  else
    raise exception 'invalid side';
  end if;
end $$;

drop function if exists public.finish_match(uuid);

-- Points come from the app domain (src/domain/scoring.ts). A draw passes 0/0 and awards nothing.
create or replace function public.finish_match(match_id uuid, win_points int, lose_points int) returns void
language plpgsql security definer set search_path = public as $$
declare m public.matches; win_id uuid; lose_id uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if win_points < 0 or lose_points < 0 then raise exception 'invalid points'; end if;
  select * into m from public.matches where id = match_id for update;
  if m.id is null or m.status = 'finished' then return; end if;
  if m.a_score > m.b_score then win_id := m.a_id; lose_id := m.b_id;
  elsif m.b_score > m.a_score then win_id := m.b_id; lose_id := m.a_id;
  end if;
  if win_id is not null and lose_id is not null then
    update public.players set points = points + win_points, wins = wins + 1 where id = win_id;
    update public.players set points = points + lose_points, losses = losses + 1 where id = lose_id;
  end if;
  update public.matches set status = 'finished' where id = match_id;
end $$;

revoke execute on function public.bump_score(uuid, text, int) from public, anon;
revoke execute on function public.finish_match(uuid, int, int) from public, anon;
grant execute on function public.bump_score(uuid, text, int) to authenticated;
grant execute on function public.finish_match(uuid, int, int) to authenticated;
