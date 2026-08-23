-- DuoAkva Diary: catalog and user photos
alter table if exists public.plant_catalog add column if not exists image_url text;
alter table if exists public.livestock_catalog add column if not exists image_url text;
alter table if exists public.aquarium_plants add column if not exists user_image_url text;
alter table if exists public.aquarium_livestock add column if not exists user_image_url text;
alter table if exists public.aquarium_equipment add column if not exists user_image_url text;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('entity-photos','entity-photos',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- Public viewing is intentional: catalog/user entity photos are displayed inside the app.
drop policy if exists "entity photos public read" on storage.objects;
create policy "entity photos public read" on storage.objects for select using (bucket_id='entity-photos');

drop policy if exists "entity photos user upload" on storage.objects;
create policy "entity photos user upload" on storage.objects for insert to authenticated
with check (bucket_id='entity-photos' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "entity photos user update" on storage.objects;
create policy "entity photos user update" on storage.objects for update to authenticated
using (bucket_id='entity-photos' and owner_id=auth.uid()::text)
with check (bucket_id='entity-photos' and owner_id=auth.uid()::text);

drop policy if exists "entity photos user delete" on storage.objects;
create policy "entity photos user delete" on storage.objects for delete to authenticated
using (bucket_id='entity-photos' and owner_id=auth.uid()::text);
