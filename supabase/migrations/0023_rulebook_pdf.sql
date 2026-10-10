-- Rulebook PDFs uploaded from the admin Rules page are stored in the media bucket.
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
  where id = 'media';
