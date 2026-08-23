-- DuoAkva Diary: repair livestock_catalog schema without deleting existing data

alter table public.livestock_catalog
  add column if not exists common_name text,
  add column if not exists category text,
  add column if not exists variant text,
  add column if not exists adult_size_cm numeric,
  add column if not exists min_tank_l numeric,
  add column if not exists min_group_size integer,
  add column if not exists recommended_group_size integer,
  add column if not exists temperature_min numeric,
  add column if not exists temperature_max numeric,
  add column if not exists ph_min numeric,
  add column if not exists ph_max numeric,
  add column if not exists gh_min numeric,
  add column if not exists gh_max numeric,
  add column if not exists kh_min numeric,
  add column if not exists kh_max numeric,
  add column if not exists temperament text,
  add column if not exists swimming_zone text,
  add column if not exists diet text,
  add column if not exists difficulty text,
  add column if not exists shrimp_safe boolean,
  add column if not exists snail_safe boolean,
  add column if not exists plant_safe boolean,
  add column if not exists notes text,
  add column if not exists image_url text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists verification_status text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.livestock_catalog set category = 'fish' where category is null;
update public.livestock_catalog set verification_status = 'unverified' where verification_status is null;
update public.livestock_catalog set created_at = now() where created_at is null;
update public.livestock_catalog set updated_at = now() where updated_at is null;

alter table public.livestock_catalog alter column category set default 'fish';
alter table public.livestock_catalog alter column verification_status set default 'unverified';
alter table public.livestock_catalog alter column created_at set default now();
alter table public.livestock_catalog alter column updated_at set default now();

create index if not exists livestock_catalog_category_idx on public.livestock_catalog(category);
create index if not exists livestock_catalog_scientific_name_idx on public.livestock_catalog(scientific_name);
create index if not exists livestock_catalog_common_name_idx on public.livestock_catalog(common_name);
