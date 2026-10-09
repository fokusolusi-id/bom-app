-- "Hero" slider becomes "What's new": uploaded videos or YouTube links, shown below the gallery.

-- Drop the old check constraints (their names were generated), keep everything else.
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid = 'public.site_media'::regclass and contype = 'c' loop
    execute format('alter table public.site_media drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.site_media alter column path drop not null;
alter table public.site_media add column if not exists youtube_id text;

-- The existing teaser moves to news/ (upload site-media-upload/hero/teaser.mp4 to media/news/teaser.mp4 first).
update public.site_media set section = 'news', path = 'news/teaser.mp4' where section = 'hero';

alter table public.site_media
  add constraint site_media_section_check check (section in ('news', 'gallery')),
  add constraint site_media_kind_check check (kind in ('image', 'video', 'youtube')),
  add constraint site_media_path_check check (path is null or path ~ '^(news|gallery)/[A-Za-z0-9_-]{1,80}\.(jpg|png|webp|mp4|webm)$'),
  add constraint site_media_youtube_check check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  add constraint site_media_shape_check check (
    (kind = 'youtube' and youtube_id is not null and path is null)
    or (kind in ('image', 'video') and path is not null and youtube_id is null)
  ),
  add constraint site_media_section_kind_check check (
    (section = 'gallery' and kind = 'image') or (section = 'news' and kind in ('video', 'youtube'))
  );
