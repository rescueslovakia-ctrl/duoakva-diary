alter table public.profiles add column if not exists role text not null default 'user' check (role in ('user','admin'));

create or replace function public.is_admin_user(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((select role='admin' from public.profiles where id=p_user),false)
$$;

create or replace function public.has_premium_access(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
 select public.is_admin_user(p_user) or coalesce((select premium_until>now() from public.user_subscriptions where user_id=p_user),false)
$$;

revoke all on function public.is_admin_user(uuid) from public,anon;
revoke all on function public.has_premium_access(uuid) from public,anon;
grant execute on function public.is_admin_user(uuid) to authenticated;
grant execute on function public.has_premium_access(uuid) to authenticated;

create or replace function public.enforce_free_aquarium_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
 if public.has_premium_access(new.user_id) then return new; end if;
 select count(*) into v_count from public.aquariums where user_id=new.user_id;
 if v_count>=1 then raise exception 'premium_required_more_aquariums' using errcode='P0001'; end if;
 return new;
end;$$;

create or replace function public.claim_photo_ai_analysis(p_photo_id uuid)
returns table(usage_id uuid,next_available_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_last timestamptz;v_usage uuid;v_interval interval;
begin
 if v_user is null then raise exception 'not_authenticated'; end if;
 if not exists(select 1 from public.aquarium_photos p join public.aquariums a on a.id=p.aquarium_id where p.id=p_photo_id and a.user_id=v_user) then raise exception 'photo_not_owned'; end if;
 v_interval:=case when public.has_premium_access(v_user) then interval '4 days' else interval '30 days' end;
 perform pg_advisory_xact_lock(hashtext(v_user::text));
 select max(used_at) into v_last from public.photo_ai_usage where user_id=v_user;
 if v_last is not null and v_last>now()-v_interval then return query select null::uuid,v_last+v_interval;return;end if;
 insert into public.photo_ai_usage(user_id,photo_id) values(v_user,p_photo_id) returning id into v_usage;
 return query select v_usage,now()+v_interval;
end;$$;
