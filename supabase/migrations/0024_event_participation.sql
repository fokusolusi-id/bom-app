-- Results now cover every scored event (Ranked, Cup, Major, Championship): each row is one player who took part.
-- `place` stays empty for players outside the top places; `tiger_king` marks the Tiger King bonus.
-- Leaderboard points are calculated from these rows and the points table.
alter table public.event_placements alter column place drop not null;
alter table public.event_placements add column tiger_king boolean not null default false;

-- Points have decimals (e.g. 0.25 for taking part), so a whole number is not enough.
alter table public.players alter column points type numeric(8, 2);
