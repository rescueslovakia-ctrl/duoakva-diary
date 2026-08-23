import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";
export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get("q")||"").trim().replace(/[%(),]/g,"");
 const category=(req.nextUrl.searchParams.get("category")||"").trim();
 const page=Math.max(1,Number(req.nextUrl.searchParams.get("page")||1));
 const pageSize=Math.min(24,Math.max(1,Number(req.nextUrl.searchParams.get("pageSize")||12)));
 if(q.length>0&&q.length<3)return NextResponse.json({items:[],page,total:0,totalPages:0});
 try{
  const s=await createServerSupabaseClient();const from=(page-1)*pageSize,to=from+pageSize-1;
  let query=s.from("equipment_catalog").select("id,manufacturer_name,model,category,specs,official_url,source_url,verification_status",{count:"exact"}).order("manufacturer_name").order("model").range(from,to);
  if(q)query=query.or(`model.ilike.%${q}%,manufacturer_name.ilike.%${q}%,description.ilike.%${q}%`);
  if(category)query=query.eq("category",category);
  const{data,error,count}=await query;if(error)return NextResponse.json({items:[],error:error.message},{status:400});const total=count||0;return NextResponse.json({items:data||[],page,total,totalPages:Math.ceil(total/pageSize)})
 }catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}}
