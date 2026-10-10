-- One record per person: the membership form's details live on `players` instead of a separate `join_requests` table.
-- `players` is readable by the public (leaderboard), so personal details are hidden with column privileges below.

alter table public.players
  add column full_name text check (full_name is null or char_length(full_name) between 2 and 60),
  add column whatsapp text check (whatsapp is null or whatsapp ~ '^\+62[0-9]{8,13}$'),
  add column address text check (address is null or char_length(address) between 5 and 300),
  add column age_group text check (age_group is null or age_group in ('under12', 'all')),
  add column guardian_name text check (guardian_name is null or char_length(guardian_name) between 2 and 60),
  add column guardian_whatsapp text check (guardian_whatsapp is null or guardian_whatsapp ~ '^\+62[0-9]{8,13}$'),
  add column hear_from text check (hear_from is null or char_length(hear_from) <= 40),
  add column photo_consent boolean not null default false,
  add column accepted_payment boolean not null default false,
  add column payment_proof_path text check (payment_proof_path is null or payment_proof_path ~ '^proofs/[0-9a-f-]{36}\.(jpg|png|webp)$');

-- Carry over existing sign-ups (the join date becomes the player's created_at).
update public.players p set
  full_name = j.name, whatsapp = j.whatsapp, address = j.address, age_group = j.age_group,
  guardian_name = j.guardian_name, guardian_whatsapp = j.guardian_whatsapp, hear_from = j.hear_from,
  photo_consent = j.photo_consent, accepted_payment = j.accepted_payment, payment_proof_path = j.payment_proof_path,
  created_at = j.created_at
from public.join_requests j
where j.player_id = p.id;

create unique index players_whatsapp_idx on public.players (whatsapp) where whatsapp is not null;

-- Registration now creates the player with all details in one insert.
create or replace function public.register_member(
  p_full_name text, p_blader_name text, p_whatsapp text, p_address text, p_age_group text,
  p_guardian_name text, p_guardian_whatsapp text, p_hear_from text, p_payment_ack boolean, p_payment_proof text,
  p_photo boolean
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_n int;
  v_bom_id text;
begin
  if not p_payment_ack then raise exception 'consent_required'; end if;
  if p_payment_proof is null or p_payment_proof !~ '^proofs/[0-9a-f-]{36}\.(jpg|png|webp)$' then raise exception 'proof_required'; end if;
  if p_age_group = 'under12' and (p_guardian_name is null or p_guardian_whatsapp is null) then
    raise exception 'guardian_required';
  end if;
  -- Limits live here, not in the app: serverless instances don't share memory.
  if (select count(*) from public.players where whatsapp is not null and created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited';
  end if;
  if exists (select 1 from public.players where lower(btrim(name)) = lower(btrim(p_blader_name))) then
    raise exception 'duplicate_blader';
  end if;
  if exists (select 1 from public.players where whatsapp = p_whatsapp) then
    raise exception 'duplicate_whatsapp';
  end if;

  -- One writer at a time so two sign-ups can't take the same number.
  perform pg_advisory_xact_lock(hashtext('register_member'));
  select n into v_n from generate_series(1, 9999) n
   where not exists (select 1 from public.players where lower(bom_id) = 'bom-' || lpad(n::text, 3, '0'))
   order by n limit 1;
  if v_n is null then raise exception 'ids_exhausted'; end if;
  v_bom_id := 'BoM-' || lpad(v_n::text, 3, '0');

  insert into public.players (
    bom_id, name, status, full_name, whatsapp, address, age_group, guardian_name, guardian_whatsapp,
    hear_from, accepted_payment, payment_proof_path, photo_consent
  ) values (
    v_bom_id, p_blader_name, 'registered', p_full_name, p_whatsapp, p_address, p_age_group, p_guardian_name, p_guardian_whatsapp,
    p_hear_from, p_payment_ack, p_payment_proof, p_photo
  );
  return v_bom_id;
end $$;

drop function if exists public.submit_join_request(text, text, text, text);
drop table public.join_requests;

-- The public (anon) sees only what the site shows. Personal details are for signed-in admins.
revoke select on public.players from anon, authenticated;
grant select (id, bom_id, name, points, status, role, photo_path, created_at) on public.players to anon;
grant select on public.players to authenticated;
