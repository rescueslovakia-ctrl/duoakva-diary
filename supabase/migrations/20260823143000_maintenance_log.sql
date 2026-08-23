create table if not exists public.aquarium_maintenance (
  id uuid primary key default gen_random_uuid(),
  aquarium_id uuid not null references public.aquariums(id) on delete cascade,
  maintenance_type text not null,
  custom_type text,
  performed_at timestamptz not null default now(),
  water_change_l numeric,
  water_change_percent numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists aquarium_maintenance_aquarium_date_idx
  on public.aquarium_maintenance(aquarium_id, performed_at desc);

alter table public.aquarium_maintenance enable row level security;

drop policy if exists "maintenance_select_own_aquarium" on public.aquarium_maintenance;
create policy "maintenance_select_own_aquarium"
on public.aquarium_maintenance for select
to authenticated
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_maintenance.aquarium_id
    and a.user_id = auth.uid()
));

drop policy if exists "maintenance_insert_own_aquarium" on public.aquarium_maintenance;
create policy "maintenance_insert_own_aquarium"
on public.aquarium_maintenance for insert
to authenticated
with check (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_maintenance.aquarium_id
    and a.user_id = auth.uid()
));

drop policy if exists "maintenance_update_own_aquarium" on public.aquarium_maintenance;
create policy "maintenance_update_own_aquarium"
on public.aquarium_maintenance for update
to authenticated
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_maintenance.aquarium_id
    and a.user_id = auth.uid()
))
with check (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_maintenance.aquarium_id
    and a.user_id = auth.uid()
));

drop policy if exists "maintenance_delete_own_aquarium" on public.aquarium_maintenance;
create policy "maintenance_delete_own_aquarium"
on public.aquarium_maintenance for delete
to authenticated
using (exists (
  select 1 from public.aquariums a
  where a.id = aquarium_maintenance.aquarium_id
    and a.user_id = auth.uid()
));
