alter table public.aquarium_photos
  add column if not exists analyzed_at timestamptz,
  add column if not exists comparison_photo_id uuid references public.aquarium_photos(id) on delete set null;

create index if not exists aquarium_photos_analysis_lookup_idx
  on public.aquarium_photos(aquarium_id, analyzed_at desc)
  where analysis_status = 'completed';

-- Server-side API enforces one successful/started analysis per user in a rolling 7-day window.
-- These columns also preserve which earlier photo was used for longitudinal comparison.
