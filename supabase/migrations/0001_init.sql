-- BOM schema. Run in Supabase SQL editor, or `supabase db push`.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  bom_id text unique not null,
  name text not null,
  points int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  created_at timestamptz not null default now()
);

create type public.match_tier as enum ('Ranked','Cup','Major','Championship');
create type public.match_status as enum ('scheduled','live','finished');

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tier public.match_tier not null default 'Ranked',
  round text not null default 'Round 1',
  stadium text not null default 'Stadium 1',
  target int not null default 4,
  a_id uuid references public.players(id),
  b_id uuid references public.players(id),
  a_name text not null,
  b_name text not null,
  a_score int not null default 0,
  b_score int not null default 0,
  a_combo text,
  b_combo text,
  status public.match_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();

-- Finish a match and award leaderboard points (win +30, loss +10; Cup x2).
create or replace function public.finish_match(match_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m public.matches; mult int; win_id uuid; lose_id uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into m from public.matches where id = match_id for update;
  if m.status = 'finished' then return; end if;
  mult := case when m.tier = 'Ranked' then 1 else 2 end;
  if m.a_score > m.b_score then win_id := m.a_id; lose_id := m.b_id;
  elsif m.b_score > m.a_score then win_id := m.b_id; lose_id := m.a_id;
  end if;
  if win_id is not null then
    update public.players set points = points + 30*mult, wins = wins + 1 where id = win_id;
    update public.players set points = points + 10*mult, losses = losses + 1 where id = lose_id;
  end if;
  update public.matches set status = 'finished' where id = match_id;
end $$;

-- RLS: public read, admin write.
alter table public.admins enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;

create policy "players read" on public.players for select using (true);
create policy "players admin write" on public.players for all using (public.is_admin()) with check (public.is_admin());
create policy "matches read" on public.matches for select using (true);
create policy "matches admin write" on public.matches for all using (public.is_admin()) with check (public.is_admin());
create policy "admins self read" on public.admins for select using (user_id = auth.uid());

-- Realtime for the TV scoreboard.
alter publication supabase_realtime add table public.matches;

-- Sample data
insert into public.players (bom_id, name, points, wins, losses) values
 ('BOM-0001','Rakha',1240,31,6),('BOM-0007','Dimas',1105,28,8),
 ('BOM-0012','Fadil',980,24,9),('BOM-0003','Putra',915,22,11);

-- After creating your user in Supabase Auth, make yourself admin:
-- insert into public.admins (user_id) select id from auth.users where email = 'YOUR_EMAIL';
