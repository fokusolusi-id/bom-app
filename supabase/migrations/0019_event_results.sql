-- Results hang off schedule events (Cup, Major, Championship) instead of a separate tournaments table, so the name,
-- tier and date are entered once, in the schedule.

-- The old tables must be empty: there is nothing to carry over and nothing here deletes data silently.
do $$ begin
  if exists (select 1 from public.placements) or exists (select 1 from public.tournaments) then
    raise exception 'tournaments or placements still hold data; move them to schedule events first';
  end if;
end $$;

drop table public.placements;
drop table public.tournaments;

create table public.event_placements (
  event_id uuid not null references public.schedule_events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  place int not null check (place between 1 and 999),
  primary key (event_id, player_id)
);
create index event_placements_player_idx on public.event_placements (player_id);

alter table public.event_placements enable row level security;
create policy "event_placements read" on public.event_placements for select using (true);
create policy "event_placements admin write" on public.event_placements for all using (public.is_admin()) with check (public.is_admin());
