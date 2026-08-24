create extension if not exists pgcrypto;

create table if not exists public.premium_licenses (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  plan text not null check (plan in ('monthly','yearly')),
  duration_days integer not null check (duration_days > 0),
  status text not null default 'unused' check (status in ('unused','redeemed','disabled')),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  premium_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.premium_licenses enable row level security;
alter table public.user_subscriptions enable row level security;

revoke all on public.premium_licenses from anon, authenticated;
revoke insert, update, delete on public.user_subscriptions from anon, authenticated;
grant select on public.user_subscriptions to authenticated;

drop policy if exists "Users can view own subscription" on public.user_subscriptions;
create policy "Users can view own subscription"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.activate_premium_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_license public.premium_licenses%rowtype;
  v_current_until timestamptz;
  v_base timestamptz;
  v_new_until timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_code is null or length(trim(p_code)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  v_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');

  select * into v_license
  from public.premium_licenses
  where code_hash = v_hash
  for update;

  if not found or v_license.status = 'disabled' then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_license.status = 'redeemed' then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
  end if;

  select premium_until into v_current_until
  from public.user_subscriptions
  where user_id = v_user
  for update;

  v_base := greatest(coalesce(v_current_until, now()), now());
  v_new_until := v_base + make_interval(days => v_license.duration_days);

  insert into public.user_subscriptions(user_id, premium_until, updated_at)
  values (v_user, v_new_until, now())
  on conflict (user_id) do update
  set premium_until = excluded.premium_until,
      updated_at = now();

  update public.premium_licenses
  set status = 'redeemed', redeemed_by = v_user, redeemed_at = now()
  where id = v_license.id;

  return jsonb_build_object(
    'ok', true,
    'plan', v_license.plan,
    'days_added', v_license.duration_days,
    'premium_until', v_new_until
  );
end;
$$;

revoke all on function public.activate_premium_code(text) from public, anon;
grant execute on function public.activate_premium_code(text) to authenticated;
