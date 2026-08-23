import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

const allowed=["scientific_name","common_name","category","variant","adult_size_cm","min_tank_l","min_group_size","recommended_group_size","temperature_min","temperature_max","ph_min","ph_max","gh_min","gh_max","kh_min","kh_max","temperament","swimming_zone","diet","difficulty","shrimp_safe","shrimp_safety_note","snail_safe","plant_safe","notes","image_url","source_name","source_url","verification_status"] as const;

export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const id=String(body?.id||"");
  const found=body?.found&&typeof body.found==="object"?body.found:{};
  if(!id)return NextResponse.json({error:"Chýba ID položky katalógu."},{status:400});
  const s=await createServerSupabaseClient();
  const {data:current,error:readError}=await s.from("livestock_catalog").select("*").eq("id",id).single();
  if(readError||!current)return NextResponse.json({error:readError?.message||"Položka katalógu sa nenašla."},{status:404});
  const patch:Record<string,unknown>={};
  for(const key of allowed){const old=current[key],value=found[key];if((old===null||old===undefined||old==="")&&value!==null&&value!==undefined&&value!=="")patch[key]=value}
  if(Object.keys(patch).length===0)return NextResponse.json({item:current,updated_fields:[],message:"Nenašli sa nové údaje na doplnenie."});
  const {data,error}=await s.from("livestock_catalog").update(patch).eq("id",id).select("*").single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({item:data,updated_fields:Object.keys(patch),message:`Doplnených údajov: ${Object.keys(patch).length}.`});
 }catch(e:any){return NextResponse.json({error:e?.message||"Doplnenie katalógu sa nepodarilo."},{status:500})}
}
