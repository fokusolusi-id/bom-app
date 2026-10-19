-- A third kind of homepage media: pictures of upcoming events, shown in a pop-up slider when the homepage opens.
alter table public.site_media drop constraint site_media_section_check;
alter table public.site_media add constraint site_media_section_check check (section in ('news', 'gallery', 'popup'));

alter table public.site_media drop constraint site_media_path_check;
alter table public.site_media add constraint site_media_path_check
  check (path is null or path ~ '^(news|gallery|popup)/[A-Za-z0-9_-]{1,80}\.(jpg|png|webp|mp4|webm)$');

alter table public.site_media drop constraint site_media_section_kind_check;
alter table public.site_media add constraint site_media_section_kind_check
  check ((section in ('gallery', 'popup') and kind = 'image') or (section = 'news' and kind in ('video', 'youtube')));
