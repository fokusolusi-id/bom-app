-- Full founding roster. WAR moves from BoM-030 to BoM-999 (rename in place so match history stays linked).
update public.players set bom_id = 'BoM-999'
where lower(bom_id) = 'bom-030' and name = 'WAR'
  and not exists (select 1 from public.players where lower(bom_id) = 'bom-999');

insert into public.players (bom_id, name) values
  ('BoM-001', 'Dewa'),
  ('BoM-002', 'Mr. DiBo'),
  ('BoM-007', 'RaL_X'),
  ('BoM-010', 'XtaegunS'),
  ('BoM-011', '3R Monster'),
  ('BoM-012', 'Sora'),
  ('BoM-013', 'Prett'),
  ('BoM-016', 'Kamen W'),
  ('BoM-018', 'Zenn X'),
  ('BoM-020', 'Queen X'),
  ('BoM-022', 'Hirono'),
  ('BoM-025', 'Doys'),
  ('BoM-110', '3R Zero'),
  ('BoM-123', 'Decade'),
  ('BoM-168', 'Yeye'),
  ('BoM-182', 'Amaterasu'),
  ('BoM-500', 'Si Tampan Leo'),
  ('BoM-555', 'SHAI HULUD'),
  ('BoM-666', 'Cals'),
  ('BoM-707', 'Tamago'),
  ('BoM-777', 'Oni-blader'),
  ('BoM-800', 'Necrozma'),
  ('BoM-888', 'Salmon Don'),
  ('BoM-899', 'Super Hero'),
  ('BoM-999', 'WAR')
on conflict (bom_id) do update set name = excluded.name;
