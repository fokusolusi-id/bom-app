-- Founding team: admin-editable roles, each with members picked from existing players.

-- Optional member photo: a path in the public `media` bucket (e.g. founding-team/dewa.jpg).
alter table public.players
  add column if not exists photo_path text check (photo_path is null or photo_path ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$');
create table public.team_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 1 and 60),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.team_members (
  role_id uuid not null references public.team_roles(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  sort_order int not null default 0,
  primary key (role_id, player_id)
);
create index team_members_player_idx on public.team_members (player_id);

alter table public.team_roles enable row level security;
alter table public.team_members enable row level security;
create policy "team_roles read" on public.team_roles for select using (true);
create policy "team_roles admin write" on public.team_roles for all using (public.is_admin()) with check (public.is_admin());
create policy "team_members read" on public.team_members for select using (true);
create policy "team_members admin write" on public.team_members for all using (public.is_admin()) with check (public.is_admin());

-- Creates or updates a role and replaces its members in one transaction. Member order = array order.
create or replace function public.save_team_role(p_id uuid, p_title text, p_sort int, p_players uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_id is null then
    insert into public.team_roles (title, sort_order) values (p_title, p_sort) returning id into v_id;
  else
    update public.team_roles set title = p_title, sort_order = p_sort where id = p_id returning id into v_id;
    if v_id is null then raise exception 'role not found'; end if;
  end if;
  delete from public.team_members where role_id = v_id;
  insert into public.team_members (role_id, player_id, sort_order)
    select v_id, pid, ord::int from unnest(p_players) with ordinality as t(pid, ord);
  return v_id;
end $$;

revoke execute on function public.save_team_role(uuid, text, int, uuid[]) from public, anon;
grant execute on function public.save_team_role(uuid, text, int, uuid[]) to authenticated;

-- Seed: roles and members as agreed in the founder meeting. Players are matched by the number in
-- their BOM ID (BOM-001 = BoM-0001), and a number with no player is skipped; pick them in /admin/tim.
insert into public.team_roles (title, sort_order) values
  ('Chair & Operations', 1), ('Head Judges & Rules', 2), ('Content & Media', 3),
  ('Partnerships & Venues', 4), ('Finance & Data', 5)
on conflict (title) do nothing;

insert into public.team_members (role_id, player_id, sort_order)
select r.id, p.id, s.ord
from (values
  ('Chair & Operations', 1, 1), ('Chair & Operations', 2, 2),
  ('Head Judges & Rules', 6, 1), ('Head Judges & Rules', 500, 2), ('Head Judges & Rules', 899, 3),
  ('Content & Media', 555, 1), ('Content & Media', 12, 2), ('Content & Media', 888, 3),
  ('Partnerships & Venues', 10, 1), ('Partnerships & Venues', 999, 2), ('Partnerships & Venues', 13, 3),
  ('Finance & Data', 25, 1), ('Finance & Data', 777, 2), ('Finance & Data', 11, 3)
) as s(title, num, ord)
join public.team_roles r on r.title = s.title
join public.players p on nullif(regexp_replace(p.bom_id, '\D', '', 'g'), '')::int = s.num
on conflict do nothing;

-- Photo paths in the media bucket (upload founding-team/*.jpg first), matched by BOM ID number.
update public.players p set photo_path = 'founding-team/' || s.file
from (values
  (1, 'dewa.jpg'), (2, 'mrdibo.jpg'), (6, 'cals.jpg'), (500, 'si-tampan-leo.jpg'), (899, 'kent.jpg'),
  (555, 'shaihulud.jpg'), (12, 'sora.jpg'), (888, 'salmon-don.jpg'),
  (10, 'xtaeguns.jpg'), (999, 'war.jpg'), (13, 'prett.jpg'),
  (25, 'doys.jpg'), (777, 'oni-blader.jpg'), (11, '3r-zero.jpg')
) as s(num, file)
where nullif(regexp_replace(p.bom_id, '\D', '', 'g'), '')::int = s.num and p.photo_path is null;
