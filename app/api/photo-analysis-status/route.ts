import {NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export async function GET(){
 try{
  const supabase=await createServerSupabaseClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Neprihlásený používateľ."},{status:401});
  const[profile,sub,usage]=await Promise.all([
   supabase.from("profiles").select("role").eq("id",user.id).maybeSingle(),
   supabase.from("user_subscriptions").select("premium_until").eq("user_id",user.id).maybeSingle(),
   supabase.from("photo_ai_usage").select("used_at").eq("user_id",user.id).order("used_at",{ascending:false}).limit(1)
  ]);
  const admin=profile.data?.role==="admin";
  if(admin)return NextResponse.json({available:true,nextAvailableAt:null,isAdmin:true,premium:true,intervalDays:0});
  const premium=!!sub.data?.premium_until&&new Date(sub.data.premium_until).getTime()>Date.now();
  const intervalDays=premium?4:30;
  const last=usage.data?.[0]?.used_at?new Date(usage.data[0].used_at):null;
  const next=last?new Date(last.getTime()+intervalDays*24*60*60*1000):null;
  const available=!next||next.getTime()<=Date.now();
  return NextResponse.json({available,nextAvailableAt:available?null:next?.toISOString()||null,isAdmin:false,premium,intervalDays});
 }catch{return NextResponse.json({available:false,error:"Stav AI analýzy sa nepodarilo načítať."},{status:500})}
}
