-- The BOM Cup competition type is removed. A Cup counted 1x like Ranked, so existing Cup events become Ranked and keep their points.
update public.schedule_events set tier = 'Ranked' where tier = 'Cup';

alter table public.schedule_events drop constraint if exists schedule_events_tier_check;
alter table public.schedule_events
  add constraint schedule_events_tier_check check (tier in ('Unrank', 'Ranked', 'Major', 'Championship', 'Break'));
