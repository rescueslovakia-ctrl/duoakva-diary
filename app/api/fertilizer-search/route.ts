import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export async function GET(req:NextRequest){
  const q=(req.nextUrl.searchParams.get("q")||"").trim();
  if(q.length<2)return NextResponse.json({items:[]});
  try{
    const s=await createServerSupabaseClient();
    const safe=q.replace(/[%(),]/g,"");
    const{data,error}=await s.from("fertilizer_catalog")
      .select("id,manufacturer,product_name,reference_liters,reference_dose_ml,nutrient_effects,official_url,verification_status")
      .or(`product_name.ilike.%${safe}%,manufacturer.ilike.%${safe}%`).limit(15);
    if(error)return NextResponse.json({items:[],error:error.message},{status:400});
    return NextResponse.json({items:data||[]});
  }catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}
}
