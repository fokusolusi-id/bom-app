-- Founding members. players.bom_id is already unique (0001); re-running is a no-op.
insert into public.players (bom_id, name) values
  ('BoM-001', 'Dewa'),
  ('BoM-002', 'Mr. DiBo'),
  ('BoM-007', 'RaL_X'),
  ('BoM-010', 'XtaegunS'),
  ('BoM-012', 'Sora'),
  ('BoM-016', 'Kamen W'),
  ('BoM-018', 'Zenn X'),
  ('BoM-020', 'Queen X'),
  ('BoM-025', 'Doys'),
  ('BoM-030', 'WAR'),
  ('BoM-123', 'Decade'),
  ('BoM-168', 'Yeye'),
  ('BoM-182', 'Amaterasu'),
  ('BoM-555', 'SHAI HULUD'),
  ('BoM-800', 'Necrozma'),
  ('BoM-707', 'Tamago'),
  ('BoM-777', 'Oni-blader'),
  ('BoM-888', 'Salmon Don')
on conflict (bom_id) do nothing;
