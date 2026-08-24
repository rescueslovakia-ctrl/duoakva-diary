import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function removeFolder(storage: any, bucket: string, folder: string): Promise<void> {
  const { data, error } = await storage.from(bucket).list(folder, { limit: 1000 });
  if (error) throw error;
  for (const item of data ?? []) {
    const path = `${folder}/${item.name}`;
    if (item.id) {
      const { error: removeError } = await storage.from(bucket).remove([path]);
      if (removeError) throw removeError;
    } else {
      await removeFolder(storage, bucket, path);
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: { confirm?: boolean } = {};
  try { body = await req.json(); } catch {}
  if (body.confirm !== true) {
    return new Response(JSON.stringify({ error: "confirmation_required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return new Response(JSON.stringify({ error: "not_authenticated" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const admin = createClient(supabaseUrl, serviceRole);
  try {
    await removeFolder(admin.storage, "aquarium-diary", user.id);
    await removeFolder(admin.storage, "entity-photos", user.id);
  } catch {
    return new Response(JSON.stringify({ error: "storage_cleanup_failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return new Response(JSON.stringify({ error: "delete_failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
