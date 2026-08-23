-- Correct reference data using verified husbandry values.
-- Safe to run repeatedly. No rows are deleted.

-- Cardinal tetra / Neonka cervena
update public.livestock_catalog
set
  common_name = coalesce(nullif(common_name,''), 'Neonka červená'),
  category = 'fish',
  adult_size_cm = 5,
  min_tank_l = 50,
  min_group_size = 10,
  recommended_group_size = greatest(coalesce(recommended_group_size, 10), 10),
  temperature_min = 23,
  temperature_max = 27,
  ph_min = 6,
  ph_max = 7,
  gh_min = 5,
  gh_max = 10,
  temperament = 'mierumilovná húfová ryba',
  shrimp_safe = true,
  snail_safe = true,
  plant_safe = true,
  notes = 'Vhodná k dospelým a väčším krevetám; môže loviť čerstvo narodené a veľmi malé trpasličie krevetky.',
  source_name = 'Overený chovateľský zdroj',
  source_url = 'https://www.shrimp.sk/paracheirodon-axelrodi',
  verification_status = 'verified'
where lower(scientific_name) = 'paracheirodon axelrodi';

-- Neocaridina davidi. Source states GH/KH as upper limits, not full optimum ranges.
-- We therefore keep minimum GH/KH NULL and store only verified maxima, so the UI must not interpret 0..max as an optimum.
update public.livestock_catalog
set
  category = 'shrimp',
  adult_size_cm = 3,
  temperature_min = 18,
  temperature_max = 28,
  ph_min = 6.8,
  ph_max = 8.0,
  gh_min = null,
  gh_max = 20,
  kh_min = null,
  kh_max = 12,
  temperament = 'veľmi pokojná a mierumilovná',
  shrimp_safe = true,
  snail_safe = true,
  plant_safe = true,
  notes = 'GH do 20 °dGH a KH do 12 °dKH sú deklarované horné limity, nie optimum od nuly. Stabilita vody je dôležitá.',
  source_name = 'Overený chovateľský zdroj',
  source_url = 'https://www.shrimp.sk/neocaridina-red-cherry',
  verification_status = 'verified'
where lower(scientific_name) = 'neocaridina davidi';
