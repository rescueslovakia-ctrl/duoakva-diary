create table if not exists public.account_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  terms_version text not null,
  privacy_version text not null,
  source text not null default 'signup',
  unique(user_id, terms_version, privacy_version, source)
);
alter table public.account_terms_acceptances enable row level security;
create policy "users_read_own_account_terms" on public.account_terms_acceptances for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.handle_signup_terms_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'terms_accepted','false') = 'true' then
    insert into public.account_terms_acceptances(user_id,terms_version,privacy_version,source)
    values(
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'terms_version',''),'unknown'),
      coalesce(nullif(new.raw_user_meta_data->>'privacy_version',''),'unknown'),
      'signup'
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_signup_terms on auth.users;
create trigger on_auth_user_signup_terms
after insert on auth.users
for each row execute function public.handle_signup_terms_acceptance();
