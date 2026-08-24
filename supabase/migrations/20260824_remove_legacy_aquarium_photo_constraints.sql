-- Compatibility repair for an older aquarium_photos schema.
-- The current application stores a private Storage object path in image_path.
-- Legacy image_url must not be required for new rows.

alter table public.aquarium_photos
  alter column image_url drop not null;

-- Keep the legacy column for compatibility with any older rows/code, but new
-- photo-diary records use image_path. Refresh PostgREST immediately afterwards.
notify pgrst, 'reload schema';
