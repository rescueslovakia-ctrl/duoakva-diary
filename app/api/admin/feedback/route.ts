import {createServerSupabaseClient} from "@/lib/supabase/server";
import {createClient} from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function adminContext(){
 const s=await createServerSupabaseClient();
 const{data:{user}}=await s.auth.getUser();
 if(!user)return null;
 const{data:profile}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error("missing_supabase_server_config");
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 return{user,admin};
}

export async function GET(req:Request){
 const ctx=await adminContext();if(!ctx)return Response.json({ok:false,error:"forbidden"},{status:403});
 const url=new URL(req.url);const showAll=url.searchParams.get("all")==="1";
 let q=ctx.admin.from("user_feedback").select("id,user_id,email,category,message,page,status,admin_note,created_at,reviewed_at,reviewed_by").order("created_at",{ascending:false}).limit(250);
 if(!showAll)q=q.in("status",["new","in_progress"]);
 const{data,error}=await q;if(error)return Response.json({ok:false,error:error.message},{status:500});
 return Response.json({ok:true,items:data||[]});
}

export async function PATCH(req:Request){
 const ctx=await adminContext();if(!ctx)return Response.json({ok:false,error:"forbidden"},{status:403});
 const b=await req.json().catch(()=>null) as any;const id=String(b?.id||"");const status=String(b?.status||"");
 if(!id||!["new","in_progress","resolved","ignored"].includes(status))return Response.json({ok:false,error:"invalid_review"},{status:400});
 const payload:any={status,admin_note:String(b?.adminNote||"").trim().slice(0,2000)||null};
 if(status==="resolved"||status==="ignored"){payload.reviewed_at=new Date().toISOString();payload.reviewed_by=ctx.user.id}else{payload.reviewed_at=null;payload.reviewed_by=null}
 const{error}=await ctx.admin.from("user_feedback").update(payload).eq("id",id);if(error)return Response.json({ok:false,error:error.message},{status:500});
 return Response.json({ok:true});
}
