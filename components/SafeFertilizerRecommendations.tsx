"use client";
import {useEffect,useMemo,useState} from "react";
import {createPortal} from "react-dom";
import {ShieldCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

type Fert={id:string;fertilizer_id?:string|null;custom_name?:string|null;custom_nutrient_effects?:any;fertilizer_catalog?:{product_name:string;manufacturer?:string|null;reference_liters:number;reference_dose_ml:number;nutrient_effects:any;verification_status:string}|null};
type PlantRow={quantity?:number;plant_catalog?:{difficulty?:string;light_requirement?:string;growth_rate?:string}|null};
type EquipmentRow={category:string;specs:any;settings:any};
type Code='no3'|'po4'|'k'|'fe'|'mg';
const nutrients:[Code,string][]=[['no3','NO₃'],['po4','PO₄'],['k','K'],['fe','Fe'],['mg','Mg']];
const defaults:Record<Code,{min:number;target:number;max:number}>={no3:{min:10,target:15,max:25},po4:{min:.5,target:1,max:2},k:{min:8,target:12,max:20},fe:{min:.05,target:.1,max:.2},mg:{min:5,target:8,max:15}};
const safeStepMax:Record<Code,number>={no3:2,po4:.2,k:2,fe:.03,mg:1};
const profileMultiplier:Record<string,number>={conservative:.7,balanced:1,intensive:1.15};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const countEffects=(e:any)=>nutrients.filter(([c])=>Number(e?.[c]||0)>0).length;

function productData(x:Fert){
 const custom=x.custom_nutrient_effects||{};
 if(custom.user_confirmed===true&&custom.effects)return{refL:Number(custom.reference_liters||100),refDose:Number(custom.reference_dose_ml||1),effects:custom.effects,name:x.custom_name||x.fertilizer_catalog?.product_name||'Hnojivo'};
 const c=x.fertilizer_catalog;
 if(c?.verification_status==='verified')return{refL:Number(c.reference_liters||100),refDose:Number(c.reference_dose_ml||1),effects:c.nutrient_effects||{},name:`${c.manufacturer||''} ${c.product_name}`.trim()};
 return null;
}

export default function SafeFertilizerRecommendations({aquariums}:{aquariums:Aquarium[]}){
 const[selectedId,setSelectedId]=useState(aquariums[0]?.id||'');
 const[items,setItems]=useState<Fert[]>([]);const[latest,setLatest]=useState<Record<string,number>>({});const[targets,setTargets]=useState<Record<string,any>>({});const[plants,setPlants]=useState<PlantRow[]>([]);const[equipment,setEquipment]=useState<EquipmentRow[]>([]);const[mount,setMount]=useState<HTMLElement|null>(null);
 useEffect(()=>{if(!selectedId&&aquariums[0])setSelectedId(aquariums[0].id)},[aquariums,selectedId]);
 useEffect(()=>{
  const sync=()=>{for(const el of Array.from(document.querySelectorAll('select')) as HTMLSelectElement[]){if(aquariums.some(a=>a.id===el.value)){const label=el.closest('label')?.textContent||'';if(label.trim().startsWith('Akvárium')){setSelectedId(el.value);break}}}};
  const onChange=(e:Event)=>{const el=e.target as HTMLSelectElement;if(el?.tagName==='SELECT'&&aquariums.some(a=>a.id===el.value))sync()};
  document.addEventListener('change',onChange,true);const t=setTimeout(sync,100);return()=>{clearTimeout(t);document.removeEventListener('change',onChange,true)};
 },[aquariums]);
 useEffect(()=>{
  let host:HTMLElement|null=null,anchor:HTMLElement|null=null;
  const place=()=>{for(const h of Array.from(document.querySelectorAll('section.card h3')) as HTMLElement[]){if(h.textContent?.trim()==='Odporúčanie podľa posledného merania'){anchor=h.closest('section.card') as HTMLElement;break}}if(!anchor)return false;anchor.style.display='none';host=document.createElement('div');host.dataset.safeFertilizerRecommendations='1';anchor.insertAdjacentElement('afterend',host);setMount(host);return true};
  if(!place()){const obs=new MutationObserver(()=>{if(place())obs.disconnect()});obs.observe(document.body,{childList:true,subtree:true});return()=>obs.disconnect()}
  return()=>{if(anchor)anchor.style.display='';host?.remove()};
 },[]);
 useEffect(()=>{if(!selectedId)return;(async()=>{const s=createClient();const[f,m,t,p,e]=await Promise.all([
  s.from('aquarium_fertilizers').select('id,fertilizer_id,custom_name,custom_nutrient_effects,fertilizer_catalog(product_name,manufacturer,reference_liters,reference_dose_ml,nutrient_effects,verification_status)').eq('aquarium_id',selectedId).eq('available',true),
  s.from('measurement_sessions').select('measurement_values(parameter_code,value)').eq('aquarium_id',selectedId).order('measured_at',{ascending:false}).limit(1),
  s.from('aquarium_parameter_targets').select('parameter_code,min_value,target_value,max_value').eq('aquarium_id',selectedId),
  s.from('aquarium_plants').select('quantity,plant_catalog(difficulty,light_requirement,growth_rate)').eq('aquarium_id',selectedId),
  s.from('aquarium_equipment').select('category,specs,settings').eq('aquarium_id',selectedId).eq('active',true)
 ]);if(!f.error)setItems((f.data||[]) as any);const sess=(m.data||[])[0] as any;setLatest(Object.fromEntries((sess?.measurement_values||[]).map((v:any)=>[v.parameter_code,Number(v.value)])));const tm:any={};for(const x of t.data||[])tm[x.parameter_code]={min:Number(x.min_value),target:Number(x.target_value),max:Number(x.max_value)};setTargets(tm);setPlants((p.data||[]) as any);setEquipment((e.data||[]) as any)})()},[selectedId]);
 const aq=aquariums.find(a=>a.id===selectedId);
 const factor=useMemo(()=>{if(!aq)return .3;const ageDays=aq.setup_date?Math.max(0,Math.floor((Date.now()-new Date(`${aq.setup_date}T00:00:00`).getTime())/86400000)):null;const ageFactor=ageDays==null?.65:ageDays<7?.15:ageDays<14?.25:ageDays<28?.4:ageDays<42?.6:ageDays<60?.8:1;let sum=0,wSum=0;for(const x of plants){const p=x.plant_catalog||{};const d=(p.difficulty||'').toLowerCase(),g=(p.growth_rate||'').toLowerCase(),l=(p.light_requirement||'').toLowerCase();const df=d==='hard'?1.2:d==='medium'||d==='moderate'?1:d==='easy'||d==='low'?.75:.85;const gf=g==='fast'?1.25:g==='medium'?1:g==='slow'?.75:.9;const lf=l==='high'?1.1:l==='medium'||l==='moderate'?1:l==='low'?.9:.95;const w=Math.min(2,1+Math.log10(Math.max(1,Number(x.quantity||1)))*.35);sum+=df*gf*lf*w;wSum+=w}const plantFactor=clamp(wSum?sum/wSum:.7,.55,1.25);const lights=equipment.filter(x=>x.category==='light');const effectiveW=lights.reduce((s,x)=>s+Number(x.specs?.light_w||x.specs?.power_w||0)*(Number(x.settings?.intensity_pct??100)/100),0);const wpl=aq.net_volume_l?effectiveW/aq.net_volume_l:0;const photo=effectiveW?lights.reduce((s,x)=>s+Number(x.specs?.light_w||x.specs?.power_w||0)*(Number(x.settings?.intensity_pct??100)/100)*Number(x.settings?.photoperiod_hours??8),0)/effectiveW:0;const lightFactor=!lights.length?.7:wpl>=.4?1.1:wpl>=.25?1:wpl>=.15?.85:.65;const photoFactor=photo===0?.8:photo<6?.8:photo<=8.5?1:photo<=10?.9:.75;const co2Factor=equipment.some(x=>x.category==='co2')?1:.8;const techFactor=clamp(lightFactor*photoFactor*co2Factor,.45,1.05);return clamp(ageFactor*Math.min(1,plantFactor*techFactor)*(profileMultiplier[(aq as any).dosing_profile||'conservative']||.7),.08,1)},[aq,plants,equipment]);
 const result=useMemo(()=>{
  if(!aq)return{lines:[] as string[],plan:[] as any[],warnings:[] as string[]};
  const projected:{[k:string]:number}={...latest};const desired:Record<string,number>={};const lines:string[]=[];const warnings:string[]=[];
  for(const[code,label]of nutrients){const t=targets[code]||defaults[code],cur=latest[code];if(cur===undefined){lines.push(`Chýba aktuálne meranie ${label}.`);continue}if(cur>t.max){lines.push(`⚠️ ${label} ${cur} mg/l je nad cieľom.`);continue}if(cur>=t.min){lines.push(`✅ ${label} ${cur} mg/l je v cieľovom rozsahu.`);continue}desired[code]=Math.min((t.target-cur)*.5,safeStepMax[code])*factor}
  const products=items.map(x=>{const d=productData(x);if(!d||d.refDose<=0||d.refL<=0)return null;const perMl:any={};for(const[c]of nutrients)perMl[c]=Number(d.effects?.[c]||0)*(d.refL/aq.net_volume_l)/d.refDose;return{id:x.id,name:d.name,perMl,effects:d.effects,count:countEffects(d.effects)}}).filter(Boolean) as any[];
  const plan=new Map<string,{name:string;dose:number;perMl:any}>();
  for(const[code]of nutrients){if(!desired[code])continue;let remaining=Math.max(0,desired[code]-((projected[code]??latest[code])-(latest[code]??0)));if(remaining<=1e-6)continue;const candidates=products.filter(p=>p.perMl[code]>0).sort((a,b)=>{const sa=(a.count===1?0:100)+a.count*5-(plan.has(a.id)?2:0),sb=(b.count===1?0:100)+b.count*5-(plan.has(b.id)?2:0);return sa-sb});for(const p of candidates){if(remaining<=1e-6)break;let maxDose=Infinity;for(const[nCode]of nutrients){const per=Number(p.perMl[nCode]||0);if(per<=0||latest[nCode]===undefined)continue;const lim=targets[nCode]||defaults[nCode];const room=lim.max-(projected[nCode]??latest[nCode]);maxDose=Math.min(maxDose,Math.max(0,room/per))}if(maxDose<=1e-6)continue;const dose=Math.min(remaining/p.perMl[code],maxDose);if(dose<=1e-6)continue;const existing=plan.get(p.id)||{name:p.name,dose:0,perMl:p.perMl};existing.dose+=dose;plan.set(p.id,existing);for(const[nCode]of nutrients){const inc=Number(p.perMl[nCode]||0)*dose;if(inc>0)projected[nCode]=(projected[nCode]??latest[nCode]??0)+inc}remaining=Math.max(0,desired[code]-((projected[code]??latest[code])-(latest[code]??0)))}if(remaining>desired[code]*.05)warnings.push(`${nutrients.find(x=>x[0]===code)?.[1]} sa nedá bezpečne dorovnať dostupnými hnojivami bez rizika prekročenia iného parametra.`)}
  const planned=[...plan.values()].filter(p=>p.dose>.005).map(p=>{const effects=nutrients.map(([c,l])=>{const inc=p.perMl[c]*p.dose;return inc>.0005?`${l} +${inc.toFixed(c==='fe'?3:2)} mg/l`:null}).filter(Boolean);return{...p,effects}});
  for(const[code,label]of nutrients){if(!desired[code])continue;const cur=latest[code],inc=(projected[code]??cur)-cur;if(inc>0)lines.push(`🛡️ ${label} ${cur} mg/l je pod cieľom. Spoločný bezpečný plán počíta s približne +${inc.toFixed(code==='fe'?3:2)} mg/l.`);else lines.push(`⛔ ${label} ${cur} mg/l je pod cieľom, ale bezpečnú korekciu z dostupných prípravkov nemožno odporučiť.`)}
  return{lines,plan:planned,warnings};
 },[aq,items,latest,targets,factor]);
 if(!mount)return null;
 return createPortal(<section className="card"><h3><ShieldCheck size={18}/> Odporúčanie podľa posledného merania</h3><p className="muted">Dávky sa počítajú spoločne. Jednozložkové korekčné hnojivá majú prednosť a pri kombinovaných prípravkoch sa započítava súčasný vplyv na všetky známe parametre.</p>{result.lines.map((x,i)=><p key={`l-${i}`}>{x}</p>)}{result.plan.length>0&&<div className="notice"><b>Odporúčaný prvý krok:</b>{result.plan.map((p:any)=><p key={p.name} style={{marginBottom:6}}><b>{p.dose.toFixed(2)} ml {p.name}</b> · {p.effects.join(' · ')}</p>)}<small>Po približne 24 hodinách parametre znovu premeraj. Rovnaký produkt je v pláne vždy len raz; jeho účinky sa nesčítavajú ako samostatné dávky pre jednotlivé živiny.</small></div>}{result.warnings.map((x,i)=><div className="notice" key={`w-${i}`}>⚠️ {x}</div>)}</section>,mount);
}
