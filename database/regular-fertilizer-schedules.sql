-- Additive schema: existing dosing and maintenance remain unchanged.
create schema if not exists diary_private;
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema diary_private to authenticated;
create or replace function diary_private.next_fertilizer_run(after_at timestamptz, local_time time, zone text, days integer[])
returns timestamptz language sql stable set search_path='' as $$
 select min(((after_at at time zone zone)::date + n + local_time) at time zone zone)
 from generate_series(0,8) n
 where extract(isodow from (after_at at time zone zone)::date+n)::integer=any(days)
 and (((after_at at time zone zone)::date+n+local_time) at time zone zone)>after_at
$$;
revoke all on function diary_private.next_fertilizer_run(timestamptz,time,text,integer[]) from public,anon;
grant execute on function diary_private.next_fertilizer_run(timestamptz,time,text,integer[]) to authenticated;

create or replace function diary_private.positive_number(v text) returns numeric
language sql immutable set search_path='' as $$
 select case when length(v)<100 and v ~ '^[0-9]+(\.[0-9]+)?$' then case when v::numeric>0 then v::numeric end end
$$;
revoke all on function diary_private.positive_number(text) from public,anon,authenticated;

create table public.fertilizer_schedules (
 id uuid primary key default gen_random_uuid(),
 aquarium_id uuid not null references public.aquariums(id) on delete cascade,
 aquarium_fertilizer_id uuid not null references public.aquarium_fertilizers(id) on delete cascade,
 head integer not null check(head between 1 and 4),
 dose_ml numeric not null check(dose_ml>0 and dose_ml<=10000),
 local_time time not null,
 timezone text not null default 'Europe/Bratislava',
 weekdays integer[] not null default array[1,2,3,4,5,6,7] check(cardinality(weekdays) between 1 and 7 and weekdays <@ array[1,2,3,4,5,6,7]),
 enabled boolean not null default false,
 next_run_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(aquarium_id,head)
);
create index fertilizer_schedules_due on public.fertilizer_schedules(next_run_at) where enabled;
create index fertilizer_schedules_assignment on public.fertilizer_schedules(aquarium_fertilizer_id);
alter table public.fertilizer_schedules enable row level security;
create policy "Owner manages dosing schedules" on public.fertilizer_schedules for all to authenticated
 using(exists(select 1 from public.aquariums a where a.id=aquarium_id and a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.aquariums a where a.id=aquarium_id and a.user_id=(select auth.uid())));
grant select,insert,update,delete on public.fertilizer_schedules to authenticated;
revoke all on public.fertilizer_schedules from anon;

create or replace function diary_private.validate_fertilizer_schedule() returns trigger
language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.aquarium_fertilizers f where f.id=new.aquarium_fertilizer_id and f.aquarium_id=new.aquarium_id and (f.available or not new.enabled)) then
  raise exception 'Hnojivo nepatrí k akváriu alebo nie je dostupné.';
 end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'Neplatné časové pásmo.'; end if;
 new.updated_at=now();
 if TG_OP='INSERT' then
  new.next_run_at=case when new.enabled then diary_private.next_fertilizer_run(now(),new.local_time,new.timezone,new.weekdays) end;
 elsif row(new.aquarium_id,new.aquarium_fertilizer_id,new.head,new.dose_ml,new.local_time,new.timezone,new.weekdays,new.enabled) is distinct from row(old.aquarium_id,old.aquarium_fertilizer_id,old.head,old.dose_ml,old.local_time,old.timezone,old.weekdays,old.enabled) then
  new.next_run_at=case when new.enabled then diary_private.next_fertilizer_run(now(),new.local_time,new.timezone,new.weekdays) end;
 elsif current_user<>'postgres' then
  new.next_run_at=old.next_run_at;
 end if;
 return new;
end $$;
revoke all on function diary_private.validate_fertilizer_schedule() from public,anon,authenticated;
create trigger validate_fertilizer_schedule before insert or update on public.fertilizer_schedules for each row execute function diary_private.validate_fertilizer_schedule();

alter table public.fertilizer_doses add column nutrient_snapshot jsonb;
alter table public.fertilizer_doses add column fertilizer_name_snapshot text;
-- A separate ledger prevents a deleted dose from being created again.
create table diary_private.fertilizer_schedule_runs (
 schedule_id uuid not null references public.fertilizer_schedules(id) on delete cascade,
 scheduled_at timestamptz not null,
 primary key(schedule_id,scheduled_at)
);
alter table diary_private.fertilizer_schedule_runs enable row level security;
revoke all on diary_private.fertilizer_schedule_runs from public,anon,authenticated;

create or replace function diary_private.record_fertilizer_schedules() returns integer
language plpgsql set search_path='' as $$
declare s record; f record; effects jsonb; impact jsonb; ref_l numeric; ref_ml numeric; volume numeric; dose_name text; inserted integer; total integer:=0;
begin
 for s in select * from public.fertilizer_schedules where enabled and next_run_at<=now() order by next_run_at for update skip locked loop
  select af.*,fc.manufacturer,fc.product_name,fc.verification_status,fc.reference_liters,fc.reference_dose_ml,fc.nutrient_effects into f
   from public.aquarium_fertilizers af left join public.fertilizer_catalog fc on fc.id=af.fertilizer_id where af.id=s.aquarium_fertilizer_id;
  if not f.available then
   update public.fertilizer_schedules set enabled=false where id=s.id;
   continue;
  end if;
  select net_volume_l into volume from public.aquariums where id=s.aquarium_id;
  dose_name=coalesce(nullif(trim(f.custom_name),''),nullif(trim(concat_ws(' ',f.manufacturer,f.product_name)),''),'Hnojivo');
  effects=null; ref_l=null; ref_ml=null;
  if f.custom_nutrient_effects->>'user_confirmed'='true' then
   effects=f.custom_nutrient_effects->'effects';
   ref_l=diary_private.positive_number(f.custom_nutrient_effects->>'reference_liters');
   ref_ml=diary_private.positive_number(f.custom_nutrient_effects->>'reference_dose_ml');
  elsif f.verification_status='verified' then
   effects=f.nutrient_effects; ref_l=f.reference_liters; ref_ml=f.reference_dose_ml;
  end if;
  impact=null;
  if volume>0 and ref_l>0 and ref_ml>0 and jsonb_typeof(effects)='object' then
   select jsonb_object_agg(key,diary_private.positive_number(value)*ref_l/volume*s.dose_ml/ref_ml) into impact
    from jsonb_each_text(effects) where key in ('no3','po4','k','fe','mg','ca','b','co','cu','mn','mo','zn','rb','ni','v') and diary_private.positive_number(value) is not null;
  end if;
  if impact is not null and effects->'__calculation'->>'estimated'='true' then impact=impact || '{"__estimated":1}'::jsonb; end if;
  -- Bounded recovery window; never invent months of doses after an outage.
  while s.next_run_at<=now() loop
   if s.next_run_at>=now()-interval '7 days' then
    insert into diary_private.fertilizer_schedule_runs values(s.id,s.next_run_at) on conflict do nothing;
    get diagnostics inserted=row_count;
    if inserted=1 then
     insert into public.fertilizer_doses(aquarium_id,aquarium_fertilizer_id,dose_ml,dosed_at,source_type,notes,nutrient_snapshot,fertilizer_name_snapshot)
     values(s.aquarium_id,s.aquarium_fertilizer_id,s.dose_ml,s.next_run_at,'automatic','Automatické dávkovanie podľa plánu · Hlavica '||s.head,impact,dose_name);
     total=total+1;
    end if;
   end if;
   s.next_run_at=diary_private.next_fertilizer_run(s.next_run_at,s.local_time,s.timezone,s.weekdays);
  end loop;
  update public.fertilizer_schedules set next_run_at=s.next_run_at where id=s.id;
 end loop;
 return total;
end $$;
revoke all on function diary_private.record_fertilizer_schedules() from public,anon,authenticated;
select cron.schedule('diary-fertilizer-schedules','* * * * *','select diary_private.record_fertilizer_schedules()');
