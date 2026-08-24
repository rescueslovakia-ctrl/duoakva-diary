-- PREPARATION ONLY. Do not apply to production until approved.

create table if not exists public.catalog_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null check (source_type in ('manufacturer','scientific','official_distributor','specialist_secondary','retailer','label','sds','other')),
  source_url text not null,
  retrieved_at timestamptz not null default now(),
  published_or_updated_at timestamptz,
  notes text,
  unique(source_url)
);

create table if not exists public.catalog_field_evidence (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('plant','livestock','fertilizer','equipment')),
  entity_key text not null,
  field_name text not null,
  raw_value text,
  normalized_value jsonb,
  source_id uuid not null references public.catalog_sources(id) on delete restrict,
  confidence text not null default 'unverified' check (confidence in ('verified','partial','review_required','unverified')),
  evidence_note text,
  created_at timestamptz not null default now()
);

create index if not exists catalog_field_evidence_entity_idx on public.catalog_field_evidence(entity_type,entity_key);
create index if not exists catalog_field_evidence_field_idx on public.catalog_field_evidence(entity_type,field_name);

-- Proposed metadata extensions for existing production catalogs.
-- These ALTER statements are intentionally kept in this preparation file and are NOT applied yet.

alter table public.plant_catalog
  add column if not exists verification_status text default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists source_url text;

alter table public.livestock_catalog
  add column if not exists verified_at timestamptz;

alter table public.fertilizer_catalog
  add column if not exists verification_status text default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists calculation_safe boolean not null default false;

alter table public.equipment_catalog
  add column if not exists verification_status text default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists source_name text,
  add column if not exists source_url text;

-- Fertilizer nutrient model: only verified rows may drive automatic dosing math.
create table if not exists public.fertilizer_nutrients (
  id uuid primary key default gen_random_uuid(),
  fertilizer_id uuid not null references public.fertilizer_catalog(id) on delete cascade,
  nutrient_code text not null,
  concentration_mg_l numeric,
  dose_ml numeric,
  reference_volume_l numeric,
  resulting_increase_mg_l numeric,
  expression_basis text,
  verification_status text not null default 'unverified' check (verification_status in ('verified','partial','review_required','unverified')),
  source_name text,
  source_url text,
  verified_at timestamptz,
  unique(fertilizer_id,nutrient_code,expression_basis)
);
