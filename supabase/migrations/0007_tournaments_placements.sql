-- Tournament results for the public member profile (/member/[bomId]).
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  tier public.match_tier not null,
  held_on date not null,
  created_at timestamptz not null default now()
);

create table public.placements (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  place int not null check (place >= 1),
  primary key (tournament_id, player_id)
);
create index placements_player_idx on public.placements (player_id);

alter table public.tournaments enable row level security;
alter table public.placements enable row level security;
create policy "tournaments read" on public.tournaments for select using (true);
create policy "tournaments admin write" on public.tournaments for all using (public.is_admin()) with check (public.is_admin());
create policy "placements read" on public.placements for select using (true);
create policy "placements admin write" on public.placements for all using (public.is_admin()) with check (public.is_admin());

-- Profile URLs are lower-case (/member/bom-001) while ids are stored as 'BoM-001'.
create unique index players_bom_id_lower_idx on public.players (lower(bom_id));
