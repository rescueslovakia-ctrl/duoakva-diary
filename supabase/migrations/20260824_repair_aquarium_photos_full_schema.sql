-- Repair aquarium_photos when the table existed before the current photo-diary migration.
-- CREATE TABLE IF NOT EXISTS does not add missing columns to an existing table,
-- therefore make the expected schema idempotent here.

alter table public.aquarium_photos
  add column if not exists aquarium_id uuid,
  add column if not exists image_path text,
  add column if not exists taken_at timestamptz default now(),
  add column if not exists note text,
  add column if not exists analysis_status text not null default 'not_analyzed',
  add column if not exists analysis_data jsonb,
  add column if not exists created_at timestamptz not null default now();

-- Add the aquarium FK only if an equivalent FK on aquarium_id is not already present.
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.aquarium_photos'::regclass
      and c.contype = 'f'
      and a.attname = 'aquarium_id'
  ) then
    alter table public.aquarium_photos
      add constraint aquarium_photos_aquarium_id_fkey
      foreign key (aquarium_id) references public.aquariums(id) on delete cascade;
  end if;
end $$;

create index if not exists aquarium_photos_aquarium_taken_idx
  on public.aquarium_photos(aquarium_id, taken_at desc);

alter table public.aquarium_photos enable row level security;

drop policy if exists "Users can view own aquarium photos" on public.aquarium_photos;
create policy "Users can view own aquarium photos"
on public.aquarium_photos for select
to authenticated
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

drop policy if exists "Users can add own aquarium photos" on public.aquarium_photos;
create policy "Users can add own aquarium photos"
on public.aquarium_photos for insert
to authenticated
with check (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

drop policy if exists "Users can update own aquarium photos" on public.aquarium_photos;
create policy "Users can update own aquarium photos"
on public.aquarium_photos for update
to authenticated
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
))
with check (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

drop policy if exists "Users can delete own aquarium photos" on public.aquarium_photos;
create policy "Users can delete own aquarium photos"
on public.aquarium_photos for delete
to authenticated
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

-- Ensure the private Storage bucket exists and accepts our supported image formats.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('aquarium-diary','aquarium-diary',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Users manage own aquarium diary files" on storage.objects;
create policy "Users manage own aquarium diary files"
on storage.objects for all
to authenticated
using (bucket_id='aquarium-diary' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='aquarium-diary' and (storage.foldername(name))[1]=auth.uid()::text);

-- Ask PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
