-- Reverts 0028: admin logins are no longer tied to members.
alter table public.players drop column user_id;
