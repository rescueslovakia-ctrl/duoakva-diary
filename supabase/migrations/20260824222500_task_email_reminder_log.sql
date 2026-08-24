create table if not exists public.task_email_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_date date not null,
  task_count integer not null default 0,
  sent_at timestamptz not null default now(),
  unique(user_id, reminder_date)
);

alter table public.task_email_reminder_log enable row level security;
revoke all on public.task_email_reminder_log from anon, authenticated;
