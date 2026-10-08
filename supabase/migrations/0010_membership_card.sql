-- Membership is now a paid Emoney card: simpler form (address instead of area/experience/division),
-- and age groups are 'under12' (guardian required) and 'all'.

alter table public.join_requests drop constraint join_requests_age_group_check;
update public.join_requests set age_group = case when age_group = 'under13' then 'under12' else 'all' end where age_group is not null;
alter table public.join_requests
  add constraint join_requests_age_group_check check (age_group in ('under12', 'all')),
  add column address text check (address is null or char_length(address) between 5 and 300);

drop function if exists public.register_member(text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean);

create or replace function public.register_member(
  p_full_name text, p_blader_name text, p_whatsapp text, p_address text, p_age_group text,
  p_guardian_name text, p_guardian_whatsapp text, p_hear_from text, p_rules boolean, p_privacy boolean
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_n int;
  v_bom_id text;
  v_player uuid;
begin
  if not (p_rules and p_privacy) then raise exception 'consent_required'; end if;
  if p_age_group = 'under12' and (p_guardian_name is null or p_guardian_whatsapp is null) then
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
    name, blader_name, whatsapp, address, age_group, guardian_name, guardian_whatsapp,
    hear_from, accepted_rules, accepted_privacy, player_id
  ) values (
    p_full_name, p_blader_name, p_whatsapp, p_address, p_age_group, p_guardian_name, p_guardian_whatsapp,
    p_hear_from, p_rules, p_privacy, v_player
  );
  return v_bom_id;
end $$;

revoke execute on function public.register_member(text, text, text, text, text, text, text, text, boolean, boolean) from public;
grant execute on function public.register_member(text, text, text, text, text, text, text, text, boolean, boolean) to anon, authenticated;
