import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

type Candidate={scientific_name:string;common_name?:string;difficulty?:string;light_requirement?:string;co2_requirement?:string;growth_rate?:string;placement?:string;ph_min?:number;ph_max?:number;temperature_min?:number;temperature_max?:number;notes?:string;source_url?:string;source_name:string;confidence:"high"|"medium"|"low"};

const strip=(s:string)=>s.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
const numRange=(text:string,label:string)=>{const r=new RegExp(`${label}[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\\s*(?:-|–|až|to)\\s*([0-9]+(?:[.,][0-9]+)?)`,`i`).exec(text);return r?[Number(r[1].replace(",",".")),Number(r[2].replace(",","."))] as const:null};
function parsePage(html:string,url:string,name:string):Candidate{const text=strip(html);const pH=numRange(text,"pH");const temp=numRange(text,"teplot");const low=text.match(/nenároč|nízk[^.]{0,20}svetl/i);const high=text.match(/náročn|vysok[^.]{0,20}svetl/i);const co2req=/CO2[^.]{0,50}(nutn|vyžad|odporúč|doporuč)/i.test(text);let difficulty="medium",light="medium";if(low){difficulty="easy";light="low"}if(high){difficulty="hard";light="high"}return{scientific_name:name,difficulty,light_requirement:light,co2_requirement:co2req?"recommended":"none",ph_min:pH?.[0],ph_max:pH?.[1],temperature_min:temp?.[0],temperature_max:temp?.[1],notes:"Automaticky dohľadané údaje. Pred potvrdením ich používateľ skontroloval.",source_url:url,source_name:url.includes("invital")?"INVITAL":"Web",confidence:(pH||temp||co2req)?"medium":"low"}}

export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get("q")||"").trim();if(q.length<2)return NextResponse.json({items:[]});
 try{
  const s=await createServerSupabaseClient();
  const safe=q.replace(/[%(),]/g,"");
  const {data}=await s.from("plant_catalog").select("id,scientific_name,common_name,difficulty,light_requirement,co2_requirement,growth_rate,placement,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperature_min,temperature_max,notes,image_url").or(`scientific_name.ilike.%${safe}%,common_name.ilike.%${safe}%`).limit(8);
  if(data?.length)return NextResponse.json({items:data.map(x=>({...x,source_name:"DuoAkva katalóg",confidence:"high"}))});

  const candidates:Candidate[]=[];
  try{
   const ddg=await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:invitalshop.sk ${q} akvarijna rastlina`)}`,{headers:{"User-Agent":"Mozilla/5.0 DuoAkvaDiary/1.0"},cache:"no-store"});
   const html=await ddg.text();
   const links=[...html.matchAll(/class="result__a"[^>]*href="([^"]+)"/gi)].map(m=>m[1]).slice(0,4);
   for(const raw of links){let u=raw.replace(/&amp;/g,"&");try{const parsed=new URL(u.startsWith("//")?`https:${u}`:u);const redirect=parsed.searchParams.get("uddg");if(redirect)u=decodeURIComponent(redirect)}catch{}if(!/invitalshop\.(sk|cz)/i.test(u))continue;try{const r=await fetch(u,{headers:{"User-Agent":"Mozilla/5.0 DuoAkvaDiary/1.0"},cache:"no-store",signal:AbortSignal.timeout(5000)});if(r.ok){candidates.push(parsePage(await r.text(),u,q));break}}catch{}}
  }catch{}

  try{
   const wiki=await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=3&namespace=0&format=json`,{cache:"no-store"});
   if(wiki.ok){const j=await wiki.json();for(let i=0;i<(j?.[1]?.length||0);i++){const title=String(j[1][i]);if(!title.toLowerCase().includes(q.split(" ")[0].toLowerCase())&&!q.toLowerCase().includes(title.split(" ")[0].toLowerCase()))continue;candidates.push({scientific_name:title,notes:String(j?.[2]?.[i]||""),source_url:String(j?.[3]?.[i]||""),source_name:"Wikipedia",confidence:"low"})}}
  }catch{}
  return NextResponse.json({items:candidates.slice(0,5)});
 }catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}
}
