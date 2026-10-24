-- Gold, Silver and Bronze sponsors by package, shown on the Sponsorship page and above "Supported by" on the homepage.
-- Separate from `sponsors` (the "Supported by" logos), which has no packages.
create table public.package_sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  tier text not null default 'silver' check (tier in ('gold', 'silver', 'bronze')),
  logo_path text not null check (logo_path ~ '^sponsors/[A-Za-z0-9_-]{1,80}\.(jpg|png|webp)$'),
  website text check (website is null or (char_length(website) <= 200 and website ~ '^https?://')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.package_sponsors enable row level security;
create policy "package sponsors read" on public.package_sponsors for select using (is_active or public.is_admin());
create policy "package sponsors admin write" on public.package_sponsors for all using (public.is_admin()) with check (public.is_admin());
