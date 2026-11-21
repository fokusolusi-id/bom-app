-- A player can register up to five combos at check-in (results still keep the first three).
alter table public.event_checkins drop constraint event_checkins_combos_check;
alter table public.event_checkins add constraint event_checkins_combos_check check (cardinality(combos) <= 5);
