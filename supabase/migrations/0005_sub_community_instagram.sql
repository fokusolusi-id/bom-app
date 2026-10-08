-- Instagram handle per sub community (stored without "@" or URL).
alter table public.sub_communities
  add column instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');
