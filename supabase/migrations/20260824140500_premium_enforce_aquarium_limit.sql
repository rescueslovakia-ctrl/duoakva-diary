create or replace function public.enforce_free_aquarium_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_premium boolean;
  v_count integer;
begin
  select coalesce(premium_until > now(), false)
  into v_premium
  from public.user_subscriptions
  where user_id = new.user_id;

  if coalesce(v_premium, false) then
    return new;
  end if;

  select count(*) into v_count
  from public.aquariums
  where user_id = new.user_id;

  if v_count >= 1 then
    raise exception 'premium_required_more_aquariums' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_free_aquarium_limit on public.aquariums;
create trigger trg_enforce_free_aquarium_limit
before insert on public.aquariums
for each row execute function public.enforce_free_aquarium_limit();

revoke all on function public.enforce_free_aquarium_limit() from public, anon, authenticated;
