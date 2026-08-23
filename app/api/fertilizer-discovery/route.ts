import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

const strip=(s:string)=>s.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
const norm=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const unwrap=(raw:string)=>{let u=raw.replace(/&amp;/g,"&");try{const p=new URL(u.startsWith("//")?`https:${u}`:u);const r=p.searchParams.get("uddg")||p.searchParams.get("url");if(r)u=decodeURIComponent(r)}catch{}return u};
const allowed=(u:string)=>/(invital|shrimp\.sk|aquascaperi\.sk|akvariumonline|seachem\.com|seachem\.zendesk\.com|jbl\.de|tropica\.com|easylife\.eu|sera\.de|dennerle\.com|aquasabi\.(com|de)|greenleafaquariums|plantica\.pl|zoobox\.de)/i.test(u);

type CompValue={value?:number;unit?:string;declared:boolean};
const nutrientPatterns:Record<string,RegExp>={
 no3:/\bNO.?3\b|nitrate|dusičnan/i,n:/\bN\b|nitrogen|dusík/i,po4:/\bPO.?4\b|phosphate|fosfát/i,p:/\bP\b|phosphorus|fosfor/i,k:/\bK\b|potassium|draslík/i,fe:/\bFe\b|iron|železo/i,mg:/\bMg\b|magnesium|horčík/i,ca:/\bCa\b|calcium|vápnik|vápník/i,b:/\bB\b|boron|bór/i,mo:/\bMo\b|molybdenum|molybdén/i,mn:/\bMn\b|manganese|mangán/i,zn:/\bZn\b|zinc|zinok|zinek/i,cu:/\bCu\b|copper|meď|měď/i,co:/\bCo\b|cobalt|kobalt/i,s:/\bS\b|sulfur|síra/i,na:/\bNa\b|sodium|sodík/i,cl:/\bCl\b|chloride|chlór|chlor/i
};

function compositionSection(text:string){const m=/(guaranteed analysis|declared composition|composition|zloženie|složen[ií]|obsahuje|contains)/i.exec(text);return m?text.slice(m.index,Math.min(text.length,m.index+1800)):''}
function parseComposition(text:string){const section=compositionSection(text);const out:Record<string,CompValue>={};if(!section)return out;for(const[code,re]of Object.entries(nutrientPatterns)){const m=re.exec(section);if(!m)continue;const around=section.slice(m.index,Math.min(section.length,m.index+90));const value=/([0-9]+(?:[.,][0-9]+)?)\s*(%|mg\/?l|g\/?l|ppm)/i.exec(around);out[code]=value?{declared:true,value:Number(value[1].replace(',','.')),unit:value[2]}:{declared:true}}return out}

function parseDoseEffects(text:string){const effects:Record<string,number>={};let reference_liters:number|undefined,reference_dose_ml:number|undefined;for(const[code,re]of Object.entries(nutrientPatterns)){const nutrient=re.source;const patterns=[new RegExp(`([0-9]+(?:[.,][0-9]+)?)\\s*ml[^.]{0,120}([0-9]+(?:[.,][0-9]+)?)\\s*l[^.]{0,160}(?:${nutrient})[^.]{0,100}(?:increase|raise|zvýš|adds?|pridá)[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\\s*mg\\/?l`,'i'),new RegExp(`([0-9]+(?:[.,][0-9]+)?)\\s*ml[^.]{0,160}(?:increase|raise|zvýš|adds?|pridá)[^.]{0,80}(?:${nutrient})[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\\s*mg\\/?l[^.]{0,100}([0-9]+(?:[.,][0-9]+)?)\\s*l`,'i')];for(const p of patterns){const m=p.exec(text);if(!m)continue;if(p===patterns[0]){reference_dose_ml=Number(m[1].replace(',','.'));reference_liters=Number(m[2].replace(',','.'));effects[code]=Number(m[3].replace(',','.'))}else{reference_dose_ml=Number(m[1].replace(',','.'));effects[code]=Number(m[2].replace(',','.'));reference_liters=Number(m[3].replace(',','.'))}break}}
 return{effects,reference_liters,reference_dose_ml}}

const verifiedFallbacks=[
 {manufacturer:'JBL',product_name:'PROSCAPE Mg MACROELEMENTS',reference_liters:100,reference_dose_ml:5,nutrient_effects:{mg:.625},declared_composition:{mg:{declared:true}},description:'Horčíkové hnojivo s deklarovaným obsahom Mg.',dosing_instructions:'Dávkovanie prispôsob svetlu, CO₂ a spotrebe rastlín; 5 ml/100 l zvýši Mg približne o 0,625 mg/l.',verification_status:'verified'},
 {manufacturer:'Seachem',product_name:'Flourish Iron',reference_liters:200,reference_dose_ml:5,nutrient_effects:{fe:.25},declared_composition:{fe:{declared:true,value:1,unit:'%'}},description:'Koncentrovaný zdroj železa.',dosing_instructions:'5 ml na 200 l dodá približne 0,25 mg/l Fe.',verification_status:'verified'}
];

function parsePage(html:string,url:string,fallback:string){const text=strip(html);const title=strip(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]||/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]||fallback).replace(/\s*[|–].*$/,'').trim()||fallback;let manufacturer='';const hay=(title+' '+text).toLowerCase();for(const m of ['Seachem','JBL','INVITAL','Tropica','Easy-Life','Sera','Dennerle','ADA'])if(hay.includes(m.toLowerCase())){manufacturer=m;break}const comp=parseComposition(text);const dose=parseDoseEffects(text);const dosing=(text.match(/(?:dávkování|dávkovanie|dosage|directions|dose|application|anwendung|dosierung)[^.]{0,700}\./i)||[])[0]||'';return{product_name:title,manufacturer,description:compositionSection(text).slice(0,1000)||text.slice(0,700),dosing_instructions:dosing,reference_liters:dose.reference_liters||100,reference_dose_ml:dose.reference_dose_ml||1,nutrient_effects:dose.effects,declared_composition:comp,source_url:url,source_name:'Online zdroj',confidence:Object.keys(dose.effects).length?'high':Object.keys(comp).length?'medium':'low',verification_status:Object.keys(dose.effects).length?'verified':Object.keys(comp).length?'partial':'pending'}}

export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get('q')||'').trim();
 if(q.length<3)return NextResponse.json({items:[]});
 try{
  const s=await createServerSupabaseClient();const safe=q.replace(/[%(),]/g,'');const out:any[]=[];const seen=new Set<string>();
  const add=(x:any)=>{const key=norm(`${x.manufacturer||''} ${x.product_name||''}`);if(!key||seen.has(key))return;seen.add(key);out.push(x)};
  const words=norm(q).split(' ').filter(w=>w.length>=2);
  const matches=(x:any)=>{const h=norm(`${x.manufacturer||''} ${x.product_name||''} ${x.description||''}`);return words.every(w=>h.includes(w))};

  const{data}=await s.from('fertilizer_catalog').select('id,manufacturer,product_name,reference_liters,reference_dose_ml,nutrient_effects,declared_composition,description,dosing_instructions,source_url,verification_status').or(`product_name.ilike.%${safe}%,manufacturer.ilike.%${safe}%,description.ilike.%${safe}%`).limit(30);
  for(const x of data||[])if(matches(x))add({...x,source_name:'Katalóg',confidence:x.verification_status==='verified'?'high':'medium'});
  for(const x of verifiedFallbacks)if(matches(x))add({...x,source_name:'Online zdroj',confidence:'high'});

  const compact=q.replace(/\s+/g,' ').trim();
  const searches=[...(/\bseachem\b/i.test(q)?[`site:seachem.com ${compact}`,`site:seachem.zendesk.com ${compact}`]:[]),...(/\bjbl\b/i.test(q)||/\bproscape\b/i.test(q)?[`site:jbl.de ${compact}`]:[]),`${compact} aquarium fertilizer composition dosage`,`site:invital.sk ${compact}`,`site:shrimp.sk ${compact}`,`site:aquascaperi.sk ${compact}`];
  for(const sq of searches){try{const r=await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(sq)}`,{headers:{'User-Agent':'Mozilla/5.0'},cache:'no-store',signal:AbortSignal.timeout(6500)});if(!r.ok)continue;const html=await r.text();const links=[...html.matchAll(/class="result__a"[^>]*href="([^"]+)"/gi)].map(m=>unwrap(m[1])).filter(u=>/^https?:/i.test(u)&&allowed(u)).slice(0,12);for(const u of links){try{const p=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},cache:'no-store',signal:AbortSignal.timeout(6500)});if(!p.ok)continue;const item=parsePage(await p.text(),u,q);if(matches(item))add(item)}catch{}}}catch{}}

  out.sort((a,b)=>{const av=a.verification_status==='verified'?0:a.verification_status==='partial'?1:2,bv=b.verification_status==='verified'?0:b.verification_status==='partial'?1:2;return av-bv||String(a.product_name).localeCompare(String(b.product_name))});
  return NextResponse.json({items:out.slice(0,30),message:out.length?undefined:'Produkt sa nepodarilo automaticky dohľadať. Skús presnejší názov produktu alebo výrobcu.'});
 }catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}
}
