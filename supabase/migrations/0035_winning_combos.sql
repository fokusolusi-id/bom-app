-- The Beyblade X combos a top-8 finisher (or the Tiger King) won with, up to three, written as the player typed them
-- ("AP 1-80 LR"). Shown with the results.
alter table public.event_placements
  add column combos text[] not null default '{}' check (cardinality(combos) <= 3);
