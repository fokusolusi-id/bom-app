-- Member registration on /membership: a sign-up issues a BOM ID immediately.
-- New members are 'registered' (hidden from the leaderboard) until an admin marks them 'active'.

alter table public.players
  add column status text not null default 'active' check (status in ('registered', 'active'));

alter table public.join_requests
  alter column email drop not null,
  add column blader_name text check (blader_name is null or char_length(blader_name) between 2 and 40),
  add column area text check (area is null or char_length(area) <= 40),
  add column age_group text check (age_group in ('under13', '13-17', '18plus')),
  add column guardian_name text check (guardian_name is null or char_length(guardian_name) between 2 and 60),
  add column guardian_whatsapp text check (guardian_whatsapp is null or guardian_whatsapp ~ '^\+62[0-9]{8,13}$'),
  add column experience text check (experience in ('new', 'casual', 'competitive')),
  add column hear_from text check (hear_from is null or char_length(hear_from) <= 40),
  add column accepted_rules boolean not null default false,
  add column accepted_privacy boolean not null default false,
  add column photo_consent boolean not null default false,
  add column player_id uuid references public.players(id) on delete set null;

create index join_requests_whatsapp_idx on public.join_requests (whatsapp);

drop function if exists public.submit_join_request(text, text, text, text);

create or replace function public.register_member(
  p_full_name text, p_blader_name text, p_whatsapp text, p_area text, p_age_group text,
  p_guardian_name text, p_guardian_whatsapp text, p_experience text, p_division text,
  p_hear_from text, p_rules boolean, p_privacy boolean, p_photo boolean
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_n int;
  v_bom_id text;
  v_player uuid;
begin
  if not (p_rules and p_privacy) then raise exception 'consent_required'; end if;
  if p_age_group <> '18plus' and (p_guardian_name is null or p_guardian_whatsapp is null) then
    raise exception 'guardian_required';
  end if;
  -- Limits live here, not in the app: serverless instances don't share memory.
  if (select count(*) from public.join_requests where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited';
  end if;
  if exists (select 1 from public.join_requests where whatsapp = p_whatsapp) then
    raise exception 'duplicate_whatsapp';
  end if;

  -- One writer at a time so two sign-ups can't take the same number.
  perform pg_advisory_xact_lock(hashtext('register_member'));
  select n into v_n from generate_series(1, 9999) n
   where not exists (select 1 from public.players where lower(bom_id) = 'bom-' || lpad(n::text, 3, '0'))
   order by n limit 1;
  if v_n is null then raise exception 'ids_exhausted'; end if;
  v_bom_id := 'BoM-' || lpad(v_n::text, 3, '0');

  insert into public.players (bom_id, name, status) values (v_bom_id, p_blader_name, 'registered') returning id into v_player;
  insert into public.join_requests (
    name, blader_name, whatsapp, area, age_group, guardian_name, guardian_whatsapp, experience, sub_community,
    hear_from, accepted_rules, accepted_privacy, photo_consent, player_id
  ) values (
    p_full_name, p_blader_name, p_whatsapp, p_area, p_age_group, p_guardian_name, p_guardian_whatsapp, p_experience,
    p_division, p_hear_from, p_rules, p_privacy, p_photo, v_player
  );
  return v_bom_id;
end $$;

revoke execute on function public.register_member(text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean) from public;
grant execute on function public.register_member(text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean) to anon, authenticated;
