-- Membership payment: the applicant uploads a screenshot of the transfer and acknowledges the one-time fee.
-- Private bucket: anyone may upload (anon), only admins can read.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "proofs anon upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and name ~ '^proofs/[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy "proofs admin read" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
create policy "proofs admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

alter table public.join_requests
  add column payment_proof_path text check (payment_proof_path is null or payment_proof_path ~ '^proofs/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  add column accepted_payment boolean not null default false;

drop function if exists public.register_member(text, text, text, text, text, text, text, text, boolean, boolean);

create or replace function public.register_member(
  p_full_name text, p_blader_name text, p_whatsapp text, p_address text, p_age_group text,
  p_guardian_name text, p_guardian_whatsapp text, p_hear_from text, p_rules boolean, p_privacy boolean,
  p_payment_ack boolean, p_payment_proof text
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_n int;
  v_bom_id text;
  v_player uuid;
begin
  if not (p_rules and p_privacy and p_payment_ack) then raise exception 'consent_required'; end if;
  if p_payment_proof is null or p_payment_proof !~ '^proofs/[0-9a-f-]{36}\.(jpg|png|webp)$' then raise exception 'proof_required'; end if;
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
    hear_from, accepted_rules, accepted_privacy, accepted_payment, payment_proof_path, player_id
  ) values (
    p_full_name, p_blader_name, p_whatsapp, p_address, p_age_group, p_guardian_name, p_guardian_whatsapp,
    p_hear_from, p_rules, p_privacy, p_payment_ack, p_payment_proof, v_player
  );
  return v_bom_id;
end $$;

revoke execute on function public.register_member(text, text, text, text, text, text, text, text, boolean, boolean, boolean, text) from public;
grant execute on function public.register_member(text, text, text, text, text, text, text, text, boolean, boolean, boolean, text) to anon, authenticated;
