-- Homepage slider (photos or video) and gallery, both managed in /admin/media.
create table public.site_media (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('hero', 'gallery')),
  kind text not null check (kind in ('image', 'video')),
  path text not null check (path ~ '^(hero|gallery)/[A-Za-z0-9_-]{1,80}\.(jpg|png|webp|mp4|webm)$'),
  caption text check (caption is null or char_length(caption) <= 120),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind = 'image' or section = 'hero')
);
create index site_media_section_idx on public.site_media (section, sort_order);

alter table public.site_media enable row level security;
create policy "site_media read" on public.site_media for select using (is_active or public.is_admin());
create policy "site_media admin write" on public.site_media for all using (public.is_admin()) with check (public.is_admin());

-- The media bucket now also takes short, muted slider videos (admin-only uploads).
update storage.buckets
  set file_size_limit = 20971520,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
  where id = 'media';

-- Initial content. Upload site-media-upload/* to the media bucket (hero/, gallery/) before or right after this.
insert into public.site_media (section, kind, path, sort_order) values
  ('hero', 'video', 'hero/teaser.mp4', 1),
  ('gallery', 'image', 'gallery/gallery-01.jpg', 1),
  ('gallery', 'image', 'gallery/gallery-02.jpg', 2),
  ('gallery', 'image', 'gallery/gallery-03.jpg', 3),
  ('gallery', 'image', 'gallery/gallery-04.jpg', 4),
  ('gallery', 'image', 'gallery/gallery-05.jpg', 5),
  ('gallery', 'image', 'gallery/gallery-06.jpg', 6),
  ('gallery', 'image', 'gallery/gallery-07.jpg', 7),
  ('gallery', 'image', 'gallery/gallery-08.jpg', 8),
  ('gallery', 'image', 'gallery/gallery-09.jpg', 9),
  ('gallery', 'image', 'gallery/gallery-10.jpg', 10),
  ('gallery', 'image', 'gallery/gallery-11.jpg', 11),
  ('gallery', 'image', 'gallery/gallery-12.jpg', 12),
  ('gallery', 'image', 'gallery/gallery-13.jpg', 13),
  ('gallery', 'image', 'gallery/gallery-14.jpg', 14),
  ('gallery', 'image', 'gallery/gallery-15.jpg', 15),
  ('gallery', 'image', 'gallery/gallery-16.jpg', 16),
  ('gallery', 'image', 'gallery/gallery-17.jpg', 17),
  ('gallery', 'image', 'gallery/gallery-18.jpg', 18),
  ('gallery', 'image', 'gallery/gallery-19.jpg', 19),
  ('gallery', 'image', 'gallery/gallery-20.jpg', 20),
  ('gallery', 'image', 'gallery/gallery-21.jpg', 21),
  ('gallery', 'image', 'gallery/gallery-22.jpg', 22),
  ('gallery', 'image', 'gallery/gallery-23.jpg', 23);
