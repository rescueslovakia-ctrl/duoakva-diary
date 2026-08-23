-- DuoAkva Diary: livestock catalog + aquarium stocking
-- Run once in Supabase SQL Editor if MCP migration access is unavailable.

create extension if not exists pg_trgm;

create table if not exists public.livestock_catalog (
  id uuid primary key default gen_random_uuid(),
  scientific_name text not null,
  common_name text,
  category text not null default 'fish' check (category in ('fish','shrimp','snail','crab','crayfish','amphibian','other')),
  variant text,
  adult_size_cm numeric,
  min_tank_l numeric,
  min_group_size integer,
  recommended_group_size integer,
  temperature_min numeric,
  temperature_max numeric,
  ph_min numeric,
  ph_max numeric,
  gh_min numeric,
  gh_max numeric,
  kh_min numeric,
  kh_max numeric,
  temperament text,
  swimming_zone text,
  diet text,
  difficulty text,
  shrimp_safe boolean,
  snail_safe boolean,
  plant_safe boolean,
  notes text,
  image_url text,
  source_name text,
  source_url text,
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scientific_name, variant)
);

create index if not exists livestock_catalog_scientific_name_trgm on public.livestock_catalog using gin (scientific_name gin_trgm_ops);
create index if not exists livestock_catalog_common_name_trgm on public.livestock_catalog using gin (common_name gin_trgm_ops);

create table if not exists public.aquarium_livestock (
  id uuid primary key default gen_random_uuid(),
  aquarium_id uuid not null references public.aquariums(id) on delete cascade,
  livestock_id uuid references public.livestock_catalog(id) on delete set null,
  custom_name text,
  category text not null default 'fish',
  quantity integer not null default 1 check (quantity > 0),
  sex_male integer,
  sex_female integer,
  added_date date not null default current_date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aquarium_livestock_aquarium_idx on public.aquarium_livestock(aquarium_id);
create index if not exists aquarium_livestock_species_idx on public.aquarium_livestock(livestock_id);

alter table public.livestock_catalog enable row level security;
alter table public.aquarium_livestock enable row level security;

drop policy if exists "livestock catalog readable" on public.livestock_catalog;
create policy "livestock catalog readable" on public.livestock_catalog for select to authenticated using (true);

drop policy if exists "users read own aquarium livestock" on public.aquarium_livestock;
create policy "users read own aquarium livestock" on public.aquarium_livestock for select to authenticated using (
  exists (select 1 from public.aquariums a where a.id = aquarium_id and a.user_id = auth.uid())
);
drop policy if exists "users insert own aquarium livestock" on public.aquarium_livestock;
create policy "users insert own aquarium livestock" on public.aquarium_livestock for insert to authenticated with check (
  exists (select 1 from public.aquariums a where a.id = aquarium_id and a.user_id = auth.uid())
);
drop policy if exists "users update own aquarium livestock" on public.aquarium_livestock;
create policy "users update own aquarium livestock" on public.aquarium_livestock for update to authenticated using (
  exists (select 1 from public.aquariums a where a.id = aquarium_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from public.aquariums a where a.id = aquarium_id and a.user_id = auth.uid())
);
drop policy if exists "users delete own aquarium livestock" on public.aquarium_livestock;
create policy "users delete own aquarium livestock" on public.aquarium_livestock for delete to authenticated using (
  exists (select 1 from public.aquariums a where a.id = aquarium_id and a.user_id = auth.uid())
);
