create table if not exists public.water_treatment_catalog (
 id uuid primary key default gen_random_uuid(),
 manufacturer text,
 product_name text not null,
 treatment_type text not null default 'remineralizer',
 form text not null default 'powder',
 dose_unit text not null default 'g',
 reference_dose numeric,
 reference_liters numeric,
 gh_increase numeric,
 kh_increase numeric,
 ca_mg_ratio text,
 notes text,
 source_url text,
 verification_status text not null default 'pending',
 enrichment_status text,
 enrichment_checked_at timestamptz,
 created_at timestamptz not null default now(),
 unique(manufacturer,product_name)
);

create table if not exists public.aquarium_water_treatments (
 id uuid primary key default gen_random_uuid(),
 aquarium_id uuid not null references public.aquariums(id) on delete cascade,
 treatment_id uuid references public.water_treatment_catalog(id) on delete set null,
 custom_name text,
 custom_data jsonb not null default '{}'::jsonb,
 available boolean not null default true,
 created_at timestamptz not null default now()
);

alter table public.water_treatment_catalog enable row level security;
alter table public.aquarium_water_treatments enable row level security;

drop policy if exists "Authenticated can read water treatment catalog" on public.water_treatment_catalog;
create policy "Authenticated can read water treatment catalog" on public.water_treatment_catalog for select to authenticated using (true);

drop policy if exists "Users manage own water treatments" on public.aquarium_water_treatments;
create policy "Users manage own water treatments" on public.aquarium_water_treatments for all to authenticated
using (exists(select 1 from public.aquariums a where a.id=aquarium_water_treatments.aquarium_id and a.user_id=auth.uid()))
with check (exists(select 1 from public.aquariums a where a.id=aquarium_water_treatments.aquarium_id and a.user_id=auth.uid()));

grant select on public.water_treatment_catalog to authenticated;
grant select,insert,update,delete on public.aquarium_water_treatments to authenticated;

insert into public.water_treatment_catalog(manufacturer,product_name,treatment_type,form,dose_unit,reference_dose,reference_liters,gh_increase,kh_increase,ca_mg_ratio,notes,source_url,verification_status)
values('INVITAL','MineralPlus GH+KH','remineralizer','powder','g',5.5,100,1.4,0.7,'3:1','Zarovnaná odmerka má 5,5 g. Produkt zvyšuje GH aj KH a je určený najmä pre RO/mäkkú vodu.','https://www.invitalshop.sk/invital-mineralplus-ghkh-250g','verified')
on conflict(manufacturer,product_name) do update set reference_dose=excluded.reference_dose,reference_liters=excluded.reference_liters,gh_increase=excluded.gh_increase,kh_increase=excluded.kh_increase,ca_mg_ratio=excluded.ca_mg_ratio,source_url=excluded.source_url,verification_status=excluded.verification_status;