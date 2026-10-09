-- Small editable settings, one JSON document per key. First use: the "How points are distributed" table.
create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]{1,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
create policy "site_settings read" on public.site_settings for select using (true);
create policy "site_settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values ('points_table', $json${"sizes": ["< 39", "40", "50", "60", "70", "80", "90"], "ranks": [{"label": "1", "values": [4, 5, 6, 7, 8, 9, 10]}, {"label": "2", "values": [3, 4, 5, 6, 7, 8, 9]}, {"label": "3", "values": [2, 3, 4, 5, 6, 7, 8]}, {"label": "4", "values": [1, 2, 3, 4.5, 5.5, 6.5, 7]}, {"label": "5", "values": [0, 0, 0, 2.5, 3.5, 4.5, 6]}, {"label": "6", "values": [0, 0, 0, 2, 3, 4, 5]}, {"label": "7", "values": [0, 0, 0, 1.5, 2, 3, 4]}, {"label": "8", "values": [0, 0, 0, 1, 1.5, 2, 3]}], "categories": [{"label": "Participant", "values": [0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1]}, {"label": "Top Cut", "values": [0.5, 0.65, 0.75, 1, 1.25, 1.5, 2]}, {"label": "Tiger King", "values": [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.5]}], "note": "Positions 1-4 do not get points for Top Cut."}$json$::jsonb)
on conflict (key) do nothing;
