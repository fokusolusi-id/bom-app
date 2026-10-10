-- The Challonge bracket an event's results were taken from; shown with the results on the site.
alter table public.schedule_events
  add column challonge_url text check (challonge_url is null or challonge_url ~ '^https://([a-z0-9-]+\.)?challonge\.com/[A-Za-z0-9_]+$');
