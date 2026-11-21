-- Anyone on the staff (admin or organizer) can see who checked in at any tournament; only admins can add, change or remove check-ins.
-- Organizers used to write the check-ins of their own community's events (0039); that is now admin only.
drop policy "event_checkins organizer" on public.event_checkins;
create policy "event_checkins staff read" on public.event_checkins for select to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid()));
