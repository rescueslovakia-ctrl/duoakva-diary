create or replace function public.claim_photo_ai_analysis(p_photo_id uuid)
returns table(usage_id uuid, next_available_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_last timestamptz;
  v_usage uuid;
  v_premium_until timestamptz;
  v_interval interval;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if not exists (
    select 1 from public.aquarium_photos p join public.aquariums a on a.id=p.aquarium_id
    where p.id=p_photo_id and a.user_id=v_user
  ) then raise exception 'photo_not_owned'; end if;

  select premium_until into v_premium_until from public.user_subscriptions where user_id=v_user;
  v_interval := case when v_premium_until is not null and v_premium_until > now() then interval '4 days' else interval '30 days' end;

  perform pg_advisory_xact_lock(hashtext(v_user::text));
  select max(used_at) into v_last from public.photo_ai_usage where user_id=v_user;
  if v_last is not null and v_last > now()-v_interval then
    return query select null::uuid, v_last+v_interval; return;
  end if;
  insert into public.photo_ai_usage(user_id,photo_id) values(v_user,p_photo_id) returning id into v_usage;
  return query select v_usage, now()+v_interval;
end;
$$;
revoke all on function public.claim_photo_ai_analysis(uuid) from public, anon;
grant execute on function public.claim_photo_ai_analysis(uuid) to authenticated;
