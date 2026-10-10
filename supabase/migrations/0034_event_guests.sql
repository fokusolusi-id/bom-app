-- Results can include people without a BOM ID (guests, e.g. from a Challonge bracket). They count as participants and keep
-- their place, but have no player record, so they never reach the leaderboard or the public results.
alter table public.event_placements drop constraint event_placements_pkey;
alter table public.event_placements add column id uuid not null default gen_random_uuid();
alter table public.event_placements add primary key (id);
alter table public.event_placements alter column player_id drop not null;
alter table public.event_placements add column guest_name text check (guest_name is null or char_length(guest_name) between 1 and 60);
alter table public.event_placements add check ((player_id is null) <> (guest_name is null));
-- One row per member per event (NULL player_ids, the guests, are distinct); ON CONFLICT (event_id, player_id) relies on this.
alter table public.event_placements add constraint event_placements_event_player_key unique (event_id, player_id);
create unique index event_placements_event_guest_idx on public.event_placements (event_id, lower(guest_name)) where guest_name is not null;
