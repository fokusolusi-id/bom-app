-- A new event type for breaks and holidays (no gathering that day).
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid = 'public.schedule_events'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%tier%' loop
    execute format('alter table public.schedule_events drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.schedule_events
  add constraint schedule_events_tier_check check (tier in ('Unrank', 'Ranked', 'Cup', 'Major', 'Championship', 'Break'));
