-- This function is executed only by the fertilizer_doses trigger and must not be callable through the exposed RPC API.
revoke all on function public.mirror_fertilizer_dose_to_maintenance() from public, anon, authenticated;
