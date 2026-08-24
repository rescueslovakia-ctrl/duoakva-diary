import type {User} from "@supabase/supabase-js";

/**
 * Server-side admin check.
 * Configure ADMIN_USER_IDS in Vercel as a comma-separated list of Supabase Auth user UUIDs.
 * UUIDs are preferred over e-mail addresses because they are stable and cannot be changed by the user.
 */
export function isAdminUser(user:User|null|undefined){
 if(!user)return false;
 const ids=(process.env.ADMIN_USER_IDS||"").split(",").map(x=>x.trim()).filter(Boolean);
 return ids.includes(user.id);
}
