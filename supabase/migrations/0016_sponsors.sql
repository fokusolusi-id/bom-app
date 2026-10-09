-- Sponsors and partners shown under "Supported by" on the homepage, managed in /admin/sponsor.
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  tier text not null default 'silver' check (tier in ('gold', 'silver', 'bronze')),
  logo_path text not null check (logo_path ~ '^sponsors/[A-Za-z0-9_-]{1,80}\.(jpg|png|webp)$'),
  website text check (website is null or (char_length(website) <= 200 and website ~ '^https?://')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;
create policy "sponsors read" on public.sponsors for select using (is_active or public.is_admin());
create policy "sponsors admin write" on public.sponsors for all using (public.is_admin()) with check (public.is_admin());

-- Deli Park hosts the weekly Ranked (venue partner = silver). Logo: media/sponsors/deli-park.png.
insert into public.sponsors (name, tier, logo_path, sort_order) values ('Deli Park', 'silver', 'sponsors/deli-park.png', 1)
on conflict (name) do nothing;
