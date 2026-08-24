alter view public.aquarium_lighting_summary set (security_invoker = true);

-- Trigger functions are executed by PostgreSQL triggers and must not be callable through the exposed RPC API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_signup_terms_acceptance() from public, anon, authenticated;
revoke all on function public.sync_measurement_context_reset() from public, anon, authenticated;

-- This helper is used by an authenticated AI-analysis request to return a claimed credit after a failed analysis.
revoke all on function public.release_photo_ai_analysis(uuid) from public, anon;
grant execute on function public.release_photo_ai_analysis(uuid) to authenticated;

-- Disable the legacy Premium activation overload because it bypasses the current legal-consent flow.
revoke all on function public.activate_premium_code(text) from public, anon, authenticated;
