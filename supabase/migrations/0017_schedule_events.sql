-- Schedule: events are now data, edited in /admin/jadwal, instead of a weekday guessed from each sub community's text.

-- The free-text weekday on sub communities is no longer used.
alter table public.sub_communities alter column schedule drop not null;

create table public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  sub_community_id uuid references public.sub_communities(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  starts_at timestamptz not null,
  place text not null check (char_length(place) between 1 and 120),
  tier text not null default 'Ranked' check (tier in ('Unrank', 'Ranked', 'Cup', 'Major', 'Championship')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index schedule_events_starts_idx on public.schedule_events (starts_at);

alter table public.schedule_events enable row level security;
create policy "schedule_events read" on public.schedule_events for select using (is_active or public.is_admin());
create policy "schedule_events admin write" on public.schedule_events for all using (public.is_admin()) with check (public.is_admin());

-- Seed: the next 8 weeks of each sub community's current weekday at 18:00 WIB, as weekly Ranked.
insert into public.schedule_events (sub_community_id, name, starts_at, place, tier)
select sc.id, 'Weekly Ranked', (d::date + time '18:00') at time zone 'Asia/Jakarta', 'Rivapark Floor UG Deli Park Medan', 'Ranked'
from public.sub_communities sc
cross join lateral (select case
    when sc.schedule ilike '%minggu%' then 0 when sc.schedule ilike '%senin%' then 1 when sc.schedule ilike '%selasa%' then 2
    when sc.schedule ilike '%rabu%' then 3 when sc.schedule ilike '%kamis%' then 4 when sc.schedule ilike '%jum%' then 5
    when sc.schedule ilike '%sabtu%' then 6 end as dow) w
cross join generate_series((now() at time zone 'Asia/Jakarta')::date, (now() at time zone 'Asia/Jakarta')::date + 55, interval '1 day') d
where w.dow is not null and extract(dow from d) = w.dow;
