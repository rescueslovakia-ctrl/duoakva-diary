-- DuoAkva Diary: store confirmed online husbandry data on user's aquarium livestock row
-- This avoids granting users write access to the shared livestock_catalog.

alter table public.aquarium_livestock
  add column if not exists discovery_data jsonb;

comment on column public.aquarium_livestock.discovery_data is
  'User-confirmed online husbandry snapshot for a manually added livestock item. Used when no shared catalog row is linked.';
