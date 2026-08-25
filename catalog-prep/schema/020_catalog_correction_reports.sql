-- PREPARATION ONLY. Do not apply to production until explicitly approved.

create table if not exists public.catalog_correction_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('fertilizer','plant','livestock','equipment')),
  entity_id uuid,
  entity_key text not null,
  report_type text not null default 'incorrect_data' check (report_type in ('incorrect_data','incorrect_dosage','missing_data','new_variant','other')),
  field_key text,
  current_value text,
  proposed_value text not null,
  package_label_text text,
  evidence_image_path text,
  user_note text,
  status text not null default 'pending' check (status in ('pending','needs_review','approved','rejected','duplicate')),
  grouped_report_key text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_correction_reports_status_idx on public.catalog_correction_reports(status, created_at desc);
create index if not exists catalog_correction_reports_entity_idx on public.catalog_correction_reports(entity_type, entity_key);
create index if not exists catalog_correction_reports_group_idx on public.catalog_correction_reports(grouped_report_key) where grouped_report_key is not null;

alter table public.catalog_correction_reports enable row level security;

-- Reporter may create and read only own reports. Reporters may not approve or mutate catalog data.
create policy "catalog reports insert own" on public.catalog_correction_reports
for insert to authenticated
with check (reporter_user_id = auth.uid() and status = 'pending' and reviewed_by is null and reviewed_at is null);

create policy "catalog reports read own" on public.catalog_correction_reports
for select to authenticated
using (reporter_user_id = auth.uid());

-- Admin read/update policy intentionally not defined here until deployment review.
-- It must use the final server-side admin authorization mechanism, not a client-editable claim.

-- Suggested private storage bucket at deployment: catalog-report-evidence
-- Path convention: <user_id>/<report_id>/<uuid>.<ext>
-- Upload policy must require first path component = auth.uid().
