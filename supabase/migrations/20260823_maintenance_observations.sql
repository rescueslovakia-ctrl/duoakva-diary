create table if not exists public.aquarium_observations (
  id uuid primary key default gen_random_uuid(),
  aquarium_id uuid not null references public.aquariums(id) on delete cascade,
  observation_type text not null default 'algae',
  issue_code text not null,
  severity text not null default 'mild' check (severity in ('mild','moderate','strong')),
  locations text[] not null default '{}',
  status text not null default 'active' check (status in ('active','improving','resolved','worsening')),
  observed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.aquarium_observations enable row level security;

drop policy if exists "Users can view own aquarium observations" on public.aquarium_observations;
create policy "Users can view own aquarium observations" on public.aquarium_observations for select using (
  exists (select 1 from public.aquariums a where a.id=aquarium_observations.aquarium_id and a.user_id=auth.uid())
);
drop policy if exists "Users can insert own aquarium observations" on public.aquarium_observations;
create policy "Users can insert own aquarium observations" on public.aquarium_observations for insert with check (
  exists (select 1 from public.aquariums a where a.id=aquarium_observations.aquarium_id and a.user_id=auth.uid())
);
drop policy if exists "Users can update own aquarium observations" on public.aquarium_observations;
create policy "Users can update own aquarium observations" on public.aquarium_observations for update using (
  exists (select 1 from public.aquariums a where a.id=aquarium_observations.aquarium_id and a.user_id=auth.uid())
);
drop policy if exists "Users can delete own aquarium observations" on public.aquarium_observations;
create policy "Users can delete own aquarium observations" on public.aquarium_observations for delete using (
  exists (select 1 from public.aquariums a where a.id=aquarium_observations.aquarium_id and a.user_id=auth.uid())
);
create index if not exists aquarium_observations_aquarium_date_idx on public.aquarium_observations(aquarium_id,observed_at desc);