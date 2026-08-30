alter table public.user_feedback
  add column if not exists status text not null default 'new' check (status in ('new','in_progress','resolved','ignored')),
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create index if not exists user_feedback_status_created_idx
  on public.user_feedback(status, created_at desc);
