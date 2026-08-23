import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=45;

type Analysis={
 summary:string;
 condition:"good"|"watch"|"attention";
 plant_cover_percent:number|null;
 algae_detected:boolean;
 algae_types:string[];
 algae_severity:"none"|"mild"|"moderate"|"strong"|"unknown";
 water_clarity:"clear"|"slightly_hazy"|"hazy"|"unknown";
 glass_cleanliness:"clean"|"minor_deposits"|"dirty"|"unknown";
 plant_condition:"good"|"mixed"|"poor"|"unknown";
 observations:string[];
 suggested_actions:string[];
 confidence:"low"|"medium"|"high";
 internal_trend_score:number|null;
};

function clampScore(v:any){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):null}
function normalize(x:any):Analysis{return{
 summary:String(x?.summary||"Na fotografii nebolo možné spoľahlivo určiť stav akvária."),
 condition:["good","watch","attention"].includes(x?.condition)?x.condition:"watch",
 plant_cover_percent:Number.isFinite(Number(x?.plant_cover_percent))?Math.max(0,Math.min(100,Math.round(Number(x.plant_cover_percent)))):null,
 algae_detected:Boolean(x?.algae_detected),
 algae_types:Array.isArray(x?.algae_types)?x.algae_types.map(String).slice(0,6):[],
 algae_severity:["none","mild","moderate","strong","unknown"].includes(x?.algae_severity)?x.algae_severity:"unknown",
 water_clarity:["clear","slightly_hazy","hazy","unknown"].includes(x?.water_clarity)?x.water_clarity:"unknown",
 glass_cleanliness:["clean","minor_deposits","dirty","unknown"].includes(x?.glass_cleanliness)?x.glass_cleanliness:"unknown",
 plant_condition:["good","mixed","poor","unknown"].includes(x?.plant_condition)?x.plant_condition:"unknown",
 observations:Array.isArray(x?.observations)?x.observations.map(String).slice(0,8):[],
 suggested_actions:Array.isArray(x?.suggested_actions)?x.suggested_actions.map(String).slice(0,6):[],
 confidence:["low","medium","high"].includes(x?.confidence)?x.confidence:"low",
 internal_trend_score:clampScore(x?.internal_trend_score)
}}

export async function POST(req:NextRequest){
 try{
  const supabase=await createServerSupabaseClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Neprihlásený používateľ."},{status:401});
  const body=await req.json();const photoId=String(body?.photoId||"");
  if(!photoId)return NextResponse.json({error:"Chýba fotografia."},{status:400});
  const{data:photo,error}=await supabase.from("aquarium_photos").select("id,aquarium_id,image_path,taken_at,note,aquariums!inner(id,name,user_id)").eq("id",photoId).single();
  if(error||!photo||(photo as any).aquariums?.user_id!==user.id)return NextResponse.json({error:"Fotografia nebola nájdená."},{status:404});
  await supabase.from("aquarium_photos").update({analysis_status:"analyzing"}).eq("id",photoId);
  const signed=await supabase.storage.from("aquarium-diary").createSignedUrl(photo.image_path,300);
  if(!signed.data?.signedUrl)throw new Error("Nepodarilo sa načítať fotografiu.");
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)throw new Error("OPENAI_API_KEY nie je nastavený.");
  const prompt=`Analyzuj fotografiu celého akvária ako dlhodobý akvaristický fotodenník. Buď konzervatívny: z fotografie neurčuj chemické parametre vody ani konkrétnu diagnózu, ak nie je vizuálne podložená. Posudzuj iba to, čo je reálne viditeľné.\n\nVráť VÝHRADNE platný JSON bez markdownu s kľúčmi: summary, condition, plant_cover_percent, algae_detected, algae_types, algae_severity, water_clarity, glass_cleanliness, plant_condition, observations, suggested_actions, confidence, internal_trend_score.\ncondition: good|watch|attention. algae_severity: none|mild|moderate|strong|unknown. water_clarity: clear|slightly_hazy|hazy|unknown. glass_cleanliness: clean|minor_deposits|dirty|unknown. plant_condition: good|mixed|poor|unknown. confidence: low|medium|high. plant_cover_percent 0-100 alebo null. internal_trend_score 0-100 je interná vizuálna metrika, kde 100 znamená veľmi dobrý vizuálny stav; používateľovi sa číslo nebude zobrazovať.\nPri algae_types používaj len vizuálne pravdepodobné typy a ak si neistý, nechaj pole prázdne. suggested_actions majú byť krátke, praktické a nesmú odporúčať dávkovanie liečiv či chémie iba podľa fotografie.`;
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL||"gpt-5.6-luna",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:signed.data.signedUrl,detail:"low"}]}],max_output_tokens:1200})});
  if(!r.ok)throw new Error(`Vision API ${r.status}`);
  const j=await r.json();
  const text=(j.output||[]).flatMap((o:any)=>o.content||[]).find((c:any)=>c.type==="output_text")?.text||j.output_text||"";
  let parsed:any;try{parsed=JSON.parse(text)}catch{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error("Neplatná odpoveď analýzy.");parsed=JSON.parse(m[0])}
  const analysis=normalize(parsed);
  await supabase.from("aquarium_photos").update({analysis_status:"completed",analysis_data:analysis}).eq("id",photoId);
  return NextResponse.json({analysis});
 }catch(e:any){
  try{const supabase=await createServerSupabaseClient();const body=await req.clone().json().catch(()=>null);if(body?.photoId)await supabase.from("aquarium_photos").update({analysis_status:"failed"}).eq("id",String(body.photoId))}catch{}
  return NextResponse.json({error:"Automatická analýza fotografie sa nepodarila."},{status:500});
 }
}
