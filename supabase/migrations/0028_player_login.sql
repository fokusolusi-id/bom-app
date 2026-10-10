-- Ties a member to the account they sign in with. Not readable by the public (only the listed columns are).
alter table public.players
  add column user_id uuid unique references auth.users (id) on delete set null;
