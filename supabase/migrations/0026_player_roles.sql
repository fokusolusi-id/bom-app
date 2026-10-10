-- Every player has a role in the community. It is a label for now; who can sign in to the admin area is still managed in `admins`.
alter table public.players
  add column role text not null default 'member' check (role in ('member', 'organizer', 'admin'));

-- Admins correct a member's sign-up details (name, WhatsApp, address...) from the Players page.
create policy "join_requests admin update" on public.join_requests for update using (public.is_admin()) with check (public.is_admin());
