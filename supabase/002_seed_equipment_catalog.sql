-- DuoAkva Diary: prvé testovacie položky katalógu techniky
-- Údaje sú označené ako pending, kým neprebehne manuálne overenie výrobcom.

insert into public.equipment_catalog
(manufacturer_name, model, category, specs, source_type, verification_status)
values
('INVITAL','EXPRO 1500','filter','{"nominal_flow_lph":1500}'::jsonb,'catalog','pending'),
('Sinkor','LED 100 cm 73 W','light','{"power_w":73,"light_w":73}'::jsonb,'catalog','pending')
on conflict (manufacturer_name, model, category)
do update set
  specs = excluded.specs,
  source_type = excluded.source_type,
  verification_status = excluded.verification_status,
  updated_at = now();
