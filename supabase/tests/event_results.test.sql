-- pgTAP. Run with `supabase test db` after applying migrations.
begin;
select plan(5);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local'),
                                          ('00000000-0000-0000-0000-0000000000b2', 'user@test.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.players (id, bom_id, name) values ('11111111-1111-1111-1111-111111111111', 'T-1', 'A');
insert into public.schedule_events (id, name, starts_at, place, tier) values ('55555555-5555-5555-5555-555555555555', 'X', now(), 'Here', 'Cup');

select throws_ok($$insert into public.players (bom_id, name) values ('t-1', 'dup')$$, '23505', null, 'bom_id is unique case-insensitively');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select throws_ok($$insert into public.event_placements (event_id, player_id, place) values ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 1)$$, '42501', null, 'non-admin cannot write placements');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select lives_ok($$insert into public.event_placements (event_id, player_id, place) values ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 1)$$, 'admin sets a placement');
select throws_ok($$insert into public.event_placements (event_id, player_id, place) values ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 2)$$, '23505', null, 'a player has one place per event');
select throws_ok($$insert into public.event_placements (event_id, player_id, place) values ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 0)$$, '23514', null, 'place must be >= 1');

select * from finish();
rollback;
