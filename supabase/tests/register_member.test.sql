-- pgTAP. Run with `supabase test db` after applying migrations.
begin;
select plan(8);

insert into public.players (bom_id, name) values ('BoM-001', 'A'), ('BoM-002', 'B'), ('BoM-004', 'D');

set local role anon;
select is(
  public.register_member('Full One', 'Blader One', '+6281200000001', 'Jl. Contoh 1, Medan', 'all', null, null, null, true, 'proofs/00000000-0000-0000-0000-000000000001.png', false),
  'BoM-003', 'fills the lowest free number');
select is(
  public.register_member('Full Two', 'Blader Two', '+6281200000002', 'Jl. Contoh 2, Medan', 'under12', 'Parent', '+6281200000009', 'Instagram', true, 'proofs/00000000-0000-0000-0000-000000000002.png', true),
  'BoM-005', 'next call takes the next free number');
select throws_ok(
  $$select public.register_member('Full Three', 'Blader Three', '+6281200000001', 'Jl. Contoh 3, Medan', 'all', null, null, null, true, 'proofs/00000000-0000-0000-0000-000000000001.png', false)$$,
  'duplicate_whatsapp', null, 'duplicate WhatsApp is rejected');
select throws_ok(
  $$select public.register_member('Kid', 'Kid One', '+6281200000003', 'Jl. Contoh 4, Medan', 'under12', null, null, null, true, 'proofs/00000000-0000-0000-0000-000000000001.png', false)$$,
  'guardian_required', null, 'under 12 needs a guardian');
select throws_ok(
  $$select public.register_member('No Payment Ack', 'Nope', '+6281200000004', 'Jl. Contoh 5, Medan', 'all', null, null, null, false, 'proofs/00000000-0000-0000-0000-000000000003.png', false)$$,
  'consent_required', null, 'the payment acknowledgement is required');
select is((select count(*) from public.join_requests), 0::bigint, 'anon cannot read join_requests');

reset role;
select is((select status from public.players where bom_id = 'BoM-003'), 'registered', 'new player starts registered');
select is((select status from public.players where bom_id = 'BoM-001'), 'active', 'existing players stay active');

select * from finish();
rollback;
