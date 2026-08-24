"use client";
import {useEffect,useState} from "react";
import {Gauge} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

type RangeItem={name:string;min:number;max:number};
const controllerMatch=(x:any)=>{const t=`${x?.manufacturer||''} ${x?.model||''} ${x?.notes||''}`.toLowerCase();return (x?.category==='controller'&&/(ph|co2|co₂)/i.test(t))||(x?.category==='co2'&&/(controller|control|ph)/i.test(t));};
const labelOf=(x:any,catalogKey:string)=>x?.custom_name||x?.[catalogKey]?.common_name||x?.[catalogKey]?.scientific_name||'Neznámy druh';

export default function PhControllerMeasurementStatus({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||'');const[setpoint,setSetpoint]=useState<number|null>(null);const[measured,setMeasured]=useState<number|null>(null);const[outside,setOutside]=useState<RangeItem[]>([]);const[loaded,setLoaded]=useState(false);
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{if(aquariumId)load()},[aquariumId]);
 async function load(){setLoaded(false);const s=createClient();const[e,m,l,p]=await Promise.all([
  s.from('aquarium_equipment').select('category,manufacturer,model,notes,settings').eq('aquarium_id',aquariumId).eq('active',true),
  s.from('measurement_sessions').select('measured_at,measurement_values(parameter_code,value)').eq('aquarium_id',aquariumId).order('measured_at',{ascending:false}).limit(20),
  s.from('aquarium_livestock').select('custom_name,discovery_data,livestock_catalog(common_name,scientific_name,ph_min,ph_max)').eq('aquarium_id',aquariumId).eq('active',true),
  s.from('aquarium_plants').select('custom_name,plant_catalog(common_name,scientific_name,ph_min,ph_max)').eq('aquarium_id',aquariumId)
 ]);
 const ctrl=(e.data||[]).find((x:any)=>controllerMatch(x)&&Number.isFinite(Number(x.settings?.ph_setpoint)));const sp=ctrl?Number((ctrl as any).settings.ph_setpoint):null;setSetpoint(sp);
 let ph:number|null=null;for(const session of (m.data||[]) as any[]){const v=(session.measurement_values||[]).find((x:any)=>x.parameter_code==='ph');if(v){ph=Number(v.value);break}}setMeasured(Number.isFinite(ph as number)?ph:null);
 const ranges:RangeItem[]=[];for(const x of (l.data||[]) as any[]){const c=x.livestock_catalog||x.discovery_data||{};const min=Number(c.ph_min),max=Number(c.ph_max);if(Number.isFinite(min)&&Number.isFinite(max))ranges.push({name:labelOf(x,'livestock_catalog'),min,max})}for(const x of (p.data||[]) as any[]){const c=x.plant_catalog||{};const min=Number(c.ph_min),max=Number(c.ph_max);if(Number.isFinite(min)&&Number.isFinite(max))ranges.push({name:labelOf(x,'plant_catalog'),min,max})}setOutside(sp==null?[]:ranges.filter(r=>sp<r.min||sp>r.max));setLoaded(true)}
 if(!loaded||setpoint==null)return null;const diff=measured==null?null:Math.abs(measured-setpoint);const matches=diff!=null&&diff<=0.10;
 return <section className="card"><div className="section-head"><div><small>MERANIA</small><h3><Gauge size={18}/> pH regulácia</h3></div></div><div className="form one"><label>Akvárium<select value={aquariumId} onChange={e=>setAquariumId(e.target.value)}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>{measured==null?<div className="notice">pH controller je nastavený na <b>{setpoint.toFixed(2)}</b>. Zatiaľ nemáme uložené meranie pH na porovnanie.</div>:matches?<div className="notice"><b>{outside.length===0?'✅ pH je stabilné a zodpovedá nastaveniu controlleru.':'ℹ️ pH zodpovedá nastaveniu controlleru.'}</b><p>Namerané pH <b>{measured.toFixed(2)}</b> sa zhoduje s nastavenou hodnotou <b>{setpoint.toFixed(2)}</b>.</p>{outside.length===0?<p style={{marginBottom:0}}>Hodnota je zároveň v spoločnom odporúčanom rozsahu evidovaných rastlín a živočíchov, preto ju aplikácia vyhodnocuje ako optimálnu.</p>:<p style={{marginBottom:0}}>Aplikácia túto hodnotu nepovažuje za chybu merania, pretože regulácia drží presne nastavený cieľ. Nastavené pH je však mimo odporúčaného rozsahu pre: <b>{outside.slice(0,5).map(x=>x.name).join(', ')}{outside.length>5?'…':''}</b>.</p>}</div>:<div className="notice"><b>⚠️ Namerané pH sa odlišuje od nastavenia controlleru.</b><p style={{marginBottom:0}}>Controller je nastavený na <b>{setpoint.toFixed(2)}</b>, posledné meranie je <b>{measured.toFixed(2)}</b>. Rozdiel {diff?.toFixed(2)} pH je vhodné overiť kalibráciou sondy, spínaním CO₂ a stabilitou regulácie.</p></div>}</section>;
}
