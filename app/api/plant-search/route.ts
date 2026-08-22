import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export async function GET(req:NextRequest){
  const q=(req.nextUrl.searchParams.get("q")||"").trim().replace(/[%(),]/g,"");
  if(q.length<2)return NextResponse.json({items:[]});
  try{
    const s=await createServerSupabaseClient();
    const {data,error}=await s.from("plant_catalog")
      .select("id,scientific_name,common_name,difficulty,light_requirement,co2_requirement,growth_rate,placement,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperature_min,temperature_max,notes,image_url")
      .or(`scientific_name.ilike.%${q}%,common_name.ilike.%${q}%`)
      .order("scientific_name")
      .limit(20);
    if(error)return NextResponse.json({items:[],error:error.message},{status:400});
    return NextResponse.json({items:data||[]});
  }catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}
}
