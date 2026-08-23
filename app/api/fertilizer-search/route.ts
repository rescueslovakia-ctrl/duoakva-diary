import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export async function GET(req:NextRequest){
  const q=(req.nextUrl.searchParams.get("q")||"").trim().replace(/[%(),]/g,"");
  const page=Math.max(1,Number(req.nextUrl.searchParams.get("page")||1));
  const pageSize=Math.min(24,Math.max(1,Number(req.nextUrl.searchParams.get("pageSize")||12)));
  if(q.length>0&&q.length<3)return NextResponse.json({items:[],page,total:0,totalPages:0});
  try{
    const s=await createServerSupabaseClient();
    const from=(page-1)*pageSize,to=from+pageSize-1;
    let query=s.from("fertilizer_catalog")
      .select("id,manufacturer,product_name,reference_liters,reference_dose_ml,nutrient_effects,official_url,source_url,description,dosing_instructions,verification_status",{count:"exact"})
      .order("manufacturer").order("product_name")
      .range(from,to);
    if(q)query=query.or(`product_name.ilike.%${q}%,manufacturer.ilike.%${q}%,description.ilike.%${q}%`);
    const{data,error,count}=await query;
    if(error)return NextResponse.json({items:[],error:error.message},{status:400});
    const total=count||0;
    return NextResponse.json({items:data||[],page,total,totalPages:Math.ceil(total/pageSize)});
  }catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}
}
