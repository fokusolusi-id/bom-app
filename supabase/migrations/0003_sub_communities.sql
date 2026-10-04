-- CMS-managed sub communities shown on /komunitas.
create table public.sub_communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  schedule text not null check (char_length(schedule) between 1 and 60),
  focus text check (focus is null or char_length(focus) <= 280),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sub_communities_touch before update on public.sub_communities
  for each row execute function public.touch_updated_at();

alter table public.sub_communities enable row level security;
create policy "sub_communities public read" on public.sub_communities for select using (is_active or public.is_admin());
create policy "sub_communities admin write" on public.sub_communities for all using (public.is_admin()) with check (public.is_admin());

insert into public.sub_communities (name, schedule, sort_order) values
  ('Turcil', 'Sabtu malam', 1), ('DXM', 'Sabtu malam', 2), ('3R WAR', 'Sabtu malam', 3), ('Beyground', 'Kamis malam', 4)
on conflict (name) do nothing;
