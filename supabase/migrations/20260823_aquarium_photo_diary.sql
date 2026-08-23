create table if not exists public.aquarium_photos (
  id uuid primary key default gen_random_uuid(),
  aquarium_id uuid not null references public.aquariums(id) on delete cascade,
  image_path text not null,
  taken_at timestamptz not null default now(),
  note text,
  analysis_status text not null default 'not_analyzed',
  analysis_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists aquarium_photos_aquarium_taken_idx
  on public.aquarium_photos(aquarium_id, taken_at desc);

alter table public.aquarium_photos enable row level security;

drop policy if exists "Users can view own aquarium photos" on public.aquarium_photos;
create policy "Users can view own aquarium photos"
on public.aquarium_photos for select
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

drop policy if exists "Users can add own aquarium photos" on public.aquarium_photos;
create policy "Users can add own aquarium photos"
on public.aquarium_photos for insert
with check (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

drop policy if exists "Users can update own aquarium photos" on public.aquarium_photos;
create policy "Users can update own aquarium photos"
on public.aquarium_photos for update
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

drop policy if exists "Users can delete own aquarium photos" on public.aquarium_photos;
create policy "Users can delete own aquarium photos"
on public.aquarium_photos for delete
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_photos.aquarium_id and a.user_id = auth.uid()
));

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
