alter table if exists public.aquarium_livestock
  add column if not exists enrichment_status text,
  add column if not exists enrichment_checked_at timestamptz;

alter table if exists public.livestock_catalog
  add column if not exists enrichment_status text,
  add column if not exists enrichment_checked_at timestamptz;
