create table if not exists public.photo_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid not null references public.aquarium_photos(id) on delete cascade,
  used_at timestamptz not null default now()
);

create index if not exists photo_ai_usage_user_used_idx
  on public.photo_ai_usage(user_id, used_at desc);

alter table public.photo_ai_usage enable row level security;

drop policy if exists "Users can view own photo AI usage" on public.photo_ai_usage;
create policy "Users can view own photo AI usage"
on public.photo_ai_usage for select
to authenticated
using (user_id = auth.uid());

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
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.aquarium_photos p
    join public.aquariums a on a.id = p.aquarium_id
    where p.id = p_photo_id and a.user_id = v_user
  ) then
    raise exception 'photo_not_owned';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text));

  select max(used_at) into v_last
  from public.photo_ai_usage
  where user_id = v_user;

  if v_last is not null and v_last > now() - interval '7 days' then
    return query select null::uuid, v_last + interval '7 days';
    return;
  end if;

  insert into public.photo_ai_usage(user_id, photo_id)
  values (v_user, p_photo_id)
  returning id into v_usage;

  return query select v_usage, now() + interval '7 days';
end;
$$;

grant execute on function public.claim_photo_ai_analysis(uuid) to authenticated;

create or replace function public.release_photo_ai_analysis(p_usage_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.photo_ai_usage
  where id = p_usage_id and user_id = auth.uid();
$$;

grant execute on function public.release_photo_ai_analysis(uuid) to authenticated;
