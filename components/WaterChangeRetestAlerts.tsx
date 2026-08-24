"use client";
import {useEffect,useState} from "react";
import {FlaskConical} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

type Alert={aquariumId:string;aquariumName:string;code:string;label:string;unit:string;before:number;current:number|null;waterChangedAt:string};
const meta:Record<string,{label:string;unit:string;high:(v:number)=>boolean}>={
 ph:{label:'pH',unit:'',high:v=>v>8.2},gh:{label:'GH',unit:'°dGH',high:v=>v>20},kh:{label:'KH',unit:'°dKH',high:v=>v>14},
 no2:{label:'NO₂',unit:'mg/l',high:v=>v>0},no3:{label:'NO₃',unit:'mg/l',high:v=>v>30},nh3:{label:'NH₃',unit:'mg/l',high:v=>v>0},nh4:{label:'NH₄',unit:'mg/l',high:v=>v>0.5},
 po4:{label:'PO₄',unit:'mg/l',high:v=>v>2.5},fe:{label:'Fe',unit:'mg/l',high:v=>v>0.3},k:{label:'K',unit:'mg/l',high:v=>v>25},mg:{label:'Mg',unit:'mg/l',high:v=>v>20},ca:{label:'Ca',unit:'mg/l',high:v=>v>100},
 tds:{label:'TDS',unit:'ppm',high:v=>v>500},ec:{label:'Vodivosť',unit:'µS/cm',high:v=>v>1000},temperature:{label:'Teplota',unit:'°C',high:v=>v>30}
};

export default function WaterChangeRetestAlerts({aquariums}:{aquariums:Aquarium[]}){
 const[alerts,setAlerts]=useState<Alert[]>([]);
 useEffect(()=>{if(aquariums.length)load();else setAlerts([])},[aquariums]);
 async function load(){const s=createClient();const out:Alert[]=[];for(const aq of aquariums){
  const[w,m]=await Promise.all([
   s.from('aquarium_maintenance').select('id,performed_at').eq('aquarium_id',aq.id).eq('maintenance_type','water_change').order('performed_at',{ascending:false}).limit(1),
   s.from('measurement_sessions').select('id,measured_at,context_reset_maintenance_id,measurement_values(parameter_code,value)').eq('aquarium_id',aq.id).order('measured_at',{ascending:false}).limit(100)
  ]);
  const wc=w.data?.[0] as any;if(!wc||m.error)continue;const wcTime=new Date(wc.performed_at).getTime();const sessions=(m.data||[] as any[]).filter((x:any)=>!x.context_reset_maintenance_id);
  const before=sessions.find((x:any)=>new Date(x.measured_at).getTime()<wcTime);if(!before)continue;
  const beforeVals:ObjectEntries=Object.fromEntries((before.measurement_values||[]).map((v:any)=>[v.parameter_code,Number(v.value)])) as any;
  for(const[code,valueRaw]of Object.entries(beforeVals as any)){const rule=meta[code];const value=Number(valueRaw);if(!rule||!Number.isFinite(value)||!rule.high(value))continue;
   let postValue:number|null=null;for(const session of sessions){if(new Date(session.measured_at).getTime()<=wcTime)continue;const v=(session.measurement_values||[]).find((x:any)=>x.parameter_code===code);if(v){postValue=Number(v.value);break}}
   if(postValue!=null&&Number.isFinite(postValue)&&!rule.high(postValue))continue;
   const due=wcTime+12*60*60*1000;if(postValue==null&&Date.now()<due)continue;
   out.push({aquariumId:aq.id,aquariumName:aq.name,code,label:rule.label,unit:rule.unit,before:value,current:postValue,waterChangedAt:wc.performed_at});
  }
 }
 setAlerts(out)}
 if(!alerts.length)return null;
 const grouped=new Map<string,Alert[]>();for(const a of alerts)grouped.set(a.aquariumId,[...(grouped.get(a.aquariumId)||[]),a]);
 return <section className="card"><div className="section-head"><div><small>KONTROLNÉ MERANIE</small><h3><FlaskConical size={18}/> Kontrola po výmene vody</h3></div></div><p className="muted">Pred výmenou vody boli niektoré parametre zvýšené. Po stabilizácii nádrže ich treba znovu overiť; upozornenie zmizne automaticky po normálnom kontrolnom výsledku.</p>{Array.from(grouped.entries()).map(([id,list])=><div className="notice" key={id}><b>⚠️ {list[0].aquariumName}</b><p>Od výmeny vody uplynulo dostatok času na kontrolné meranie. Premeraj: <b>{list.map(x=>x.label).join(', ')}</b>.</p>{list.map(x=><p key={x.code} style={{marginBottom:6}}>{x.current==null?<>• <b>{x.label}</b>: pred výmenou {x.before} {x.unit}. Urob nové kontrolné meranie.</>:<>• <b>{x.label}</b>: po výmene stále {x.current} {x.unit} (pred výmenou {x.before} {x.unit}). Hodnota zostáva zvýšená.</>}</p>)}</div>)}</section>;
}

type ObjectEntries=Record<string,number>;
