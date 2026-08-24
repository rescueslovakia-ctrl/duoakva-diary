-- Prevent users from promoting themselves through public.profiles.
revoke insert, update on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, display_name, language, units, email_task_notifications) on table public.profiles to authenticated;
grant update (display_name, language, units, updated_at, email_task_notifications) on table public.profiles to authenticated;

-- Remove legacy Premium activation without legal consent.
drop function if exists public.activate_premium_code(text);

-- Internal helper functions are not exposed as client RPCs.
revoke all on function public.is_admin_user(uuid) from public, anon, authenticated;
revoke all on function public.has_premium_access(uuid) from public, anon, authenticated;

-- Consent-aware Premium activation stays available only to signed-in users.
revoke all on function public.activate_premium_code(text, boolean, text) from public, anon;
grant execute on function public.activate_premium_code(text, boolean, text) to authenticated;

-- AI usage reservation/release stays available only to signed-in users.
revoke all on function public.claim_photo_ai_analysis(uuid) from public, anon;
grant execute on function public.claim_photo_ai_analysis(uuid) to authenticated;
revoke all on function public.release_photo_ai_analysis(uuid) from public, anon;
grant execute on function public.release_photo_ai_analysis(uuid) to authenticated;
