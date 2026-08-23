create table if not exists public.aquarium_tasks (
 id uuid primary key default gen_random_uuid(),
 aquarium_id uuid not null references public.aquariums(id) on delete cascade,
 title text not null,
 notes text,
 due_at timestamptz,
 recurrence text not null default 'none',
 status text not null default 'open',
 completed_at timestamptz,
 created_at timestamptz not null default now()
);

alter table public.aquarium_tasks enable row level security;

drop policy if exists "Users manage own aquarium tasks" on public.aquarium_tasks;
create policy "Users manage own aquarium tasks" on public.aquarium_tasks
for all to authenticated
using (exists(select 1 from public.aquariums a where a.id=aquarium_tasks.aquarium_id and a.user_id=auth.uid()))
with check (exists(select 1 from public.aquariums a where a.id=aquarium_tasks.aquarium_id and a.user_id=auth.uid()));

grant select,insert,update,delete on public.aquarium_tasks to authenticated;

create index if not exists aquarium_tasks_aquarium_due_idx on public.aquarium_tasks(aquarium_id,due_at);
