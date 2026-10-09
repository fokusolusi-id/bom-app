-- pgTAP. Run with `supabase test db` after applying migrations.
begin;
select plan(4);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local'),
                                          ('00000000-0000-0000-0000-0000000000b2', 'user@test.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.players (id, bom_id, name) values
  ('11111111-1111-1111-1111-111111111111', 'T-1', 'A'),
  ('22222222-2222-2222-2222-222222222222', 'T-2', 'B');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select throws_ok($$select public.save_team_role(null, 'X', 1, array['11111111-1111-1111-1111-111111111111']::uuid[])$$, 'not allowed', 'non-admin cannot save a role');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select lives_ok($$select public.save_team_role(null, 'Test Role', 9, array['22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111']::uuid[])$$, 'admin saves a role');
select is((select count(*)::int from public.team_members m join public.team_roles r on r.id = m.role_id where r.title = 'Test Role'), 2, 'two members stored');
select is((select p.bom_id from public.team_members m join public.team_roles r on r.id = m.role_id join public.players p on p.id = m.player_id where r.title = 'Test Role' and m.sort_order = 1), 'T-2', 'array order is kept');

select * from finish();
rollback;
