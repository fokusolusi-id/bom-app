-- pgTAP. Run with `supabase test db` after applying migrations.
begin;
select plan(7);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local'),
                                          ('00000000-0000-0000-0000-0000000000b2', 'user@test.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.players (id, bom_id, name) values
  ('11111111-1111-1111-1111-111111111111', 'T-1', 'A'),
  ('22222222-2222-2222-2222-222222222222', 'T-2', 'B');
insert into public.matches (id, a_id, b_id, a_name, b_name, a_score, b_score, status) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'A', 'B', 4, 2, 'live'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'A', 'B', 3, 3, 'live');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select throws_ok($$select public.finish_match('33333333-3333-3333-3333-333333333333', 30, 10)$$, 'not allowed', 'non-admin cannot finish');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select lives_ok($$select public.finish_match('33333333-3333-3333-3333-333333333333', 30, 10)$$, 'admin finishes');
select is((select points from public.players where bom_id = 'T-1'), 30, 'winner gets points');
select is((select points from public.players where bom_id = 'T-2'), 10, 'loser gets points');
select lives_ok($$select public.finish_match('33333333-3333-3333-3333-333333333333', 30, 10)$$, 'second finish is a no-op');

-- The app always sends tier points; the function itself awards nothing on a draw.
select public.finish_match('44444444-4444-4444-4444-444444444444', 30, 10);
select is((select points from public.players where bom_id = 'T-1'), 30, 'draw awards no points');
select is((select status::text from public.matches where id = '44444444-4444-4444-4444-444444444444'), 'finished', 'draw is finished');

select * from finish();
rollback;
