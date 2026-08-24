drop policy if exists "authenticated insert fertilizer catalog" on public.fertilizer_catalog;
drop policy if exists "authenticated update fertilizer catalog" on public.fertilizer_catalog;
drop policy if exists "authenticated insert plant catalog" on public.plant_catalog;
drop policy if exists "authenticated update plant catalog" on public.plant_catalog;

drop policy if exists "Users can delete own aquarium maintenance" on public.aquarium_maintenance;
drop policy if exists "Users can insert own aquarium maintenance" on public.aquarium_maintenance;
drop policy if exists "Users can update own aquarium maintenance" on public.aquarium_maintenance;
drop policy if exists "Users can view own aquarium maintenance" on public.aquarium_maintenance;

create policy "maintenance_select_own" on public.aquarium_maintenance for select to authenticated using (exists (select 1 from public.aquariums a where a.id=aquarium_maintenance.aquarium_id and a.user_id=auth.uid()));
create policy "maintenance_insert_own" on public.aquarium_maintenance for insert to authenticated with check (exists (select 1 from public.aquariums a where a.id=aquarium_maintenance.aquarium_id and a.user_id=auth.uid()));
create policy "maintenance_update_own" on public.aquarium_maintenance for update to authenticated using (exists (select 1 from public.aquariums a where a.id=aquarium_maintenance.aquarium_id and a.user_id=auth.uid())) with check (exists (select 1 from public.aquariums a where a.id=aquarium_maintenance.aquarium_id and a.user_id=auth.uid()));
create policy "maintenance_delete_own" on public.aquarium_maintenance for delete to authenticated using (exists (select 1 from public.aquariums a where a.id=aquarium_maintenance.aquarium_id and a.user_id=auth.uid()));
