-- Check-in (scrutineering) at an event: who came and the Beyblade X combos (up to three) they registered at the gate, taken by staff.
-- A row is a member (player_id) or a guest without a BOM ID (guest_name). It is kept as history; when results are saved the top 8 take their combos from here.
create table public.event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.schedule_events(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  guest_name text check (guest_name is null or char_length(guest_name) between 1 and 60),
  combos text[] not null default '{}' check (cardinality(combos) <= 3),
  -- Which staff member checked them in, and who edited the row last. The email is kept so the log stays readable if the login is removed.
  checked_in_by uuid references auth.users (id) on delete set null,
  checked_in_by_email text,
  updated_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((player_id is null) <> (guest_name is null)),
  constraint event_checkins_event_player_key unique (event_id, player_id)
);
create unique index event_checkins_event_guest_idx on public.event_checkins (event_id, lower(guest_name)) where guest_name is not null;

alter table public.event_checkins enable row level security;

create policy "event_checkins admin" on public.event_checkins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Organizers: the check-ins of their community's Unrank and Ranked events.
create policy "event_checkins organizer" on public.event_checkins for all to authenticated
  using (exists (select 1 from public.schedule_events e where e.id = event_id and e.tier in ('Unrank', 'Ranked') and public.is_organizer_of(e.sub_community_id)))
  with check (exists (select 1 from public.schedule_events e where e.id = event_id and e.tier in ('Unrank', 'Ranked') and public.is_organizer_of(e.sub_community_id)));
