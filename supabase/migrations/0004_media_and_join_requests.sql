-- Sub community photos (Supabase Storage) and the public join form on /mulai.

-- Public-read bucket; only admins can write. Uploads go straight from the browser via signed upload URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "media admin select" on storage.objects for select to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

alter table public.sub_communities
  add column image_path text check (image_path is null or image_path ~ '^sub-communities/[0-9a-f-]{36}\.(jpg|png|webp)$');

-- Join requests. Not publicly readable; inserted only through submit_join_request, which rate limits.
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  email text not null check (char_length(email) <= 120 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  whatsapp text not null check (whatsapp ~ '^\+62[0-9]{8,13}$'),
  sub_community text check (sub_community is null or char_length(sub_community) <= 60),
  created_at timestamptz not null default now()
);

create index join_requests_created_idx on public.join_requests (created_at desc);
create index join_requests_email_idx on public.join_requests (lower(email), created_at desc);

alter table public.join_requests enable row level security;
create policy "join_requests admin read" on public.join_requests for select using (public.is_admin());
create policy "join_requests admin delete" on public.join_requests for delete using (public.is_admin());

create or replace function public.submit_join_request(p_name text, p_email text, p_whatsapp text, p_sub_community text)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Limits live here, not in the app: serverless instances don't share memory.
  if (select count(*) from public.join_requests
      where lower(email) = lower(p_email) and created_at > now() - interval '1 day') >= 3
     or (select count(*) from public.join_requests where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited';
  end if;
  insert into public.join_requests (name, email, whatsapp, sub_community)
  values (p_name, lower(p_email), p_whatsapp, p_sub_community);
end $$;

revoke execute on function public.submit_join_request(text, text, text, text) from public;
grant execute on function public.submit_join_request(text, text, text, text) to anon, authenticated;
