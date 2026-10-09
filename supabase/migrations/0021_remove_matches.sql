-- Live matches are gone: points will be calculated from event results, not from scored matches.

do $$ begin
  if exists (select 1 from public.matches) then
    raise exception 'matches still holds rows; export them before removing the table';
  end if;
end $$;

drop function if exists public.finish_match(uuid, int, int);
drop function if exists public.finish_match(uuid);
drop function if exists public.bump_score(uuid, text, int);
drop trigger if exists matches_touch on public.matches;
drop table if exists public.matches;
drop type if exists public.match_status;
drop type if exists public.match_tier;

-- Wins and losses only came from matches. Points stay: they will be filled from results later.
alter table public.players drop column if exists wins, drop column if exists losses;
