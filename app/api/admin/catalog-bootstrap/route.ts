import {createServerSupabaseClient} from "@/lib/supabase/server";
import {bootstrapCatalogs} from "@/lib/catalogBootstrap";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function adminUser(){
 const s=await createServerSupabaseClient();const{data}=await s.auth.getUser();const u=data.user;if(!u)return null;
 const{data:p}=await s.from("profiles").select("role").eq("id",u.id).maybeSingle();return p?.role==="admin"?u:null;
}
export async function POST(){
 if(!await adminUser())return Response.json({ok:false,error:"forbidden"},{status:403});
 try{return Response.json({ok:true,results:await bootstrapCatalogs()})}catch(e){return Response.json({ok:false,error:e instanceof Error?e.message:"bootstrap_failed"},{status:500})}
}
