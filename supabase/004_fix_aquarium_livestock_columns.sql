-- DuoAkva Diary: repair aquarium_livestock when table existed before migration 003
-- Safe to run more than once. Does not delete existing data.

alter table public.aquarium_livestock
  add column if not exists category text,
  add column if not exists quantity integer,
  add column if not exists sex_male integer,
  add column if not exists sex_female integer,
  add column if not exists added_date date,
  add column if not exists notes text,
  add column if not exists active boolean,
  add column if not exists custom_name text,
  add column if not exists livestock_id uuid;

-- Fill safe defaults for pre-existing rows before setting defaults / constraints.
update public.aquarium_livestock set category = 'fish' where category is null;
update public.aquarium_livestock set quantity = 1 where quantity is null or quantity < 1;
update public.aquarium_livestock set added_date = current_date where added_date is null;
update public.aquarium_livestock set active = true where active is null;

alter table public.aquarium_livestock
  alter column category set default 'fish',
  alter column category set not null,
  alter column quantity set default 1,
  alter column quantity set not null,
  alter column added_date set default current_date,
  alter column added_date set not null,
  alter column active set default true,
  alter column active set not null;

-- Add foreign key only if it is missing and livestock_catalog exists.
do $$
begin
  if to_regclass('public.livestock_catalog') is not null
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.aquarium_livestock'::regclass
         and contype = 'f'
         and conname = 'aquarium_livestock_livestock_id_fkey'
     ) then
    alter table public.aquarium_livestock
      add constraint aquarium_livestock_livestock_id_fkey
      foreign key (livestock_id) references public.livestock_catalog(id) on delete set null;
  end if;
end $$;

create index if not exists aquarium_livestock_species_idx on public.aquarium_livestock(livestock_id);
create index if not exists aquarium_livestock_aquarium_idx on public.aquarium_livestock(aquarium_id);
