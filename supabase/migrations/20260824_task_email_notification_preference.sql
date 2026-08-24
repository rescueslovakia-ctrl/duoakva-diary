alter table public.profiles add column if not exists email_task_notifications boolean not null default false;

create table if not exists public.task_email_notification_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_date date not null,
  sent_at timestamptz not null default now(),
  task_count integer not null default 0,
  primary key (user_id, notification_date)
);

alter table public.task_email_notification_log enable row level security;
revoke all on public.task_email_notification_log from anon, authenticated;
