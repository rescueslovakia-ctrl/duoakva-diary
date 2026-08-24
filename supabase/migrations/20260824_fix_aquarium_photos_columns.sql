alter table public.aquarium_photos
  add column if not exists analysis_status text not null default 'not_analyzed',
  add column if not exists analysis_data jsonb,
  add column if not exists created_at timestamptz not null default now();

-- Normalize any legacy rows if the column existed without a value.
update public.aquarium_photos
set analysis_status = 'not_analyzed'
where analysis_status is null;
