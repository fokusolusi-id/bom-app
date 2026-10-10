-- Who may sign in to the admin area, and what they may do. Replaces `admins`.
--   admin:     everything
--   organizer: the schedule events (Unrank and Ranked) and the results of their own sub community
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'organizer')),
  sub_community_id uuid references public.sub_communities (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((role = 'admin') = (sub_community_id is null))
);
create unique index staff_admin_idx on public.staff (user_id) where role = 'admin';
create unique index staff_organizer_idx on public.staff (user_id, sub_community_id) where role = 'organizer';

insert into public.staff (user_id, role) select user_id, 'admin' from public.admins;

-- Every existing policy checks is_admin(), so pointing it at `staff` keeps them working.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_organizer_of(community uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select community is not null and exists (
    select 1 from public.staff where user_id = auth.uid() and role = 'organizer' and sub_community_id = community
  );
$$;

alter table public.staff enable row level security;
create policy "staff read own" on public.staff for select using (user_id = auth.uid() or public.is_admin());
create policy "staff admin write" on public.staff for all using (public.is_admin()) with check (public.is_admin());

-- Organizers: their community's Unrank and Ranked events, including hidden ones.
create policy "schedule_events organizer read" on public.schedule_events for select using (public.is_organizer_of(sub_community_id));
create policy "schedule_events organizer insert" on public.schedule_events for insert to authenticated
  with check (public.is_organizer_of(sub_community_id) and tier in ('Unrank', 'Ranked'));
create policy "schedule_events organizer update" on public.schedule_events for update to authenticated
  using (public.is_organizer_of(sub_community_id) and tier in ('Unrank', 'Ranked'))
  with check (public.is_organizer_of(sub_community_id) and tier in ('Unrank', 'Ranked'));
create policy "schedule_events organizer delete" on public.schedule_events for delete to authenticated
  using (public.is_organizer_of(sub_community_id) and tier in ('Unrank', 'Ranked'));

-- Organizers: the results of their community's Ranked events.
create policy "event_placements organizer write" on public.event_placements for all to authenticated
  using (exists (select 1 from public.schedule_events e where e.id = event_id and e.tier = 'Ranked' and public.is_organizer_of(e.sub_community_id)))
  with check (exists (select 1 from public.schedule_events e where e.id = event_id and e.tier = 'Ranked' and public.is_organizer_of(e.sub_community_id)));

drop table public.admins;
