"use client";
import {useEffect,useState} from "react";
import {Leaf,Fish} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {measurementStatus,type TargetRange,type MeasurementStatus} from "@/lib/measurementStatus";
import type {Aquarium} from "@/components/AquariumsModule";

type ParamCode="ph"|"gh"|"kh"|"temperature";
type TargetResult={range?:TargetRange;hasData:boolean;conflict:boolean};
const params:[ParamCode,string,string][]=[["ph","pH",""],["gh","GH","°dGH"],["kh","KH","°dKH"],["temperature","Teplota","°C"]];

function rangesFromRows(rows:any[],catalogKey:string):Record<ParamCode,TargetResult>{
 const out={} as Record<ParamCode,TargetResult>;
 for(const[code]of params){
  const mins:number[]=[],maxs:number[]=[];
  for(const row of rows){
   const c=row?.[catalogKey]||row?.discovery_data||{};
   const min=Number(c[`${code}_min`]),max=Number(c[`${code}_max`]);
   if(Number.isFinite(min))mins.push(min);if(Number.isFinite(max))maxs.push(max);
  }
  const hasData=mins.length>0&&maxs.length>0;
  if(!hasData){out[code]={hasData:false,conflict:false};continue}
  const min=Math.max(...mins),max=Math.min(...maxs);
  out[code]=min<=max?{hasData:true,conflict:false,range:{min,max}}:{hasData:true,conflict:true};
 }
 return out;
}

function statusText(status:MeasurementStatus){if(status==="good")return "✅ v poriadku";if(status==="warning")return "🟠 mierna odchýlka";if(status==="bad")return "🔴 mimo rozsahu";return "bez hodnotenia"}
function rangeText(x?:TargetRange){if(!x)return "";if(x.min!=null&&x.max!=null)return `${x.min}–${x.max}`;if(x.min!=null)return `od ${x.min}`;if(x.max!=null)return `do ${x.max}`;return ""}

export default function MeasurementBiologyStatus({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||"");const[values,setValues]=useState<Record<string,number>>({});const[livestock,setLivestock]=useState<Record<ParamCode,TargetResult>>({} as any);const[plants,setPlants]=useState<Record<ParamCode,TargetResult>>({} as any);const[loaded,setLoaded]=useState(false);
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{if(aquariumId)load()},[aquariumId]);
 async function load(){setLoaded(false);const s=createClient();const[m,l,p]=await Promise.all([
  s.from("measurement_sessions").select("measured_at,context_reset_maintenance_id,measurement_values(parameter_code,value)").eq("aquarium_id",aquariumId).order("measured_at",{ascending:false}).limit(20),
  s.from("aquarium_livestock").select("discovery_data,livestock_catalog(ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperature_min,temperature_max)").eq("aquarium_id",aquariumId).eq("active",true),
  s.from("aquarium_plants").select("plant_catalog(ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperature_min,temperature_max)").eq("aquarium_id",aquariumId)
 ]);
 const session=(m.data||[]).find((x:any)=>!x.context_reset_maintenance_id);setValues(session?Object.fromEntries(((session as any).measurement_values||[]).map((v:any)=>[v.parameter_code,Number(v.value)])):{});setLivestock(rangesFromRows(l.data||[],"livestock_catalog"));setPlants(rangesFromRows(p.data||[],"plant_catalog"));setLoaded(true)}
 if(!aquariums.length||!loaded||!Object.keys(values).some(k=>params.some(([c])=>c===k)))return null;
 return <section className="card"><div className="section-head"><div><small>MERANIA</small><h3>Biologické vyhodnotenie parametrov</h3></div></div><p className="muted">Rovnaká hodnota vody môže byť vhodná pre rastliny a zároveň menej vhodná pre niektoré živočíchy, alebo naopak. Preto ich DuoAkva Diary hodnotí oddelene.</p><div className="form one"><label>Akvárium<select value={aquariumId} onChange={e=>setAquariumId(e.target.value)}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div><div style={{display:"grid",gap:10}}>{params.filter(([code])=>values[code]!==undefined).map(([code,label,unit])=>{const v=values[code],lr=livestock[code],pr=plants[code];const ls=lr?.range?measurementStatus(code,v,lr.range):null;const ps=pr?.range?measurementStatus(code,v,pr.range):null;return <div className="measurement-row" key={code}><div><b>{label}: {v} {unit}</b></div><div style={{display:"grid",gap:4,minWidth:260}}><div><Fish size={14} style={{verticalAlign:"middle"}}/> <b>Osádka:</b> {lr?.conflict?"⚠️ bez spoločného rozsahu":lr?.hasData&&ls?`${statusText(ls)}${lr.range?` · ${rangeText(lr.range)} ${unit}`:""}`:"bez dostupných rozsahov"}</div><div><Leaf size={14} style={{verticalAlign:"middle"}}/> <b>Rastliny:</b> {pr?.conflict?"⚠️ bez spoločného rozsahu":pr?.hasData&&ps?`${statusText(ps)}${pr.range?` · ${rangeText(pr.range)} ${unit}`:""}`:"bez dostupných rozsahov"}</div></div></div>})}</div></section>;
}
