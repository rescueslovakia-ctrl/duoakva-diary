"use client";
import {useEffect,useState} from "react";
import {AlertTriangle,FlaskConical} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

type State={aquariumId:string;lastMeasurement:string|null;lastDose:string|null;doseMl:number|null;fertilizerName:string|null};

export default function FertilizerMeasurementGuard({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||"");
 const[state,setState]=useState<State|null>(null);
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{if(aquariumId)load()},[aquariumId]);
 async function load(){
  const s=createClient();
  const[m,d]=await Promise.all([
   s.from('measurement_sessions').select('measured_at,context_reset_maintenance_id').eq('aquarium_id',aquariumId).is('context_reset_maintenance_id',null).order('measured_at',{ascending:false}).limit(1).maybeSingle(),
   s.from('fertilizer_doses').select('dosed_at,dose_ml,aquarium_fertilizer_id,aquarium_fertilizers(custom_name,fertilizer_catalog(manufacturer,product_name))').eq('aquarium_id',aquariumId).order('dosed_at',{ascending:false}).limit(1).maybeSingle()
  ]);
  const dose:any=d.data;
  const af:any=dose?.aquarium_fertilizers;
  const cat:any=af?.fertilizer_catalog;
  const name=cat?`${cat.manufacturer||''} ${cat.product_name||''}`.trim():(af?.custom_name||null);
  setState({aquariumId,lastMeasurement:m.data?.measured_at||null,lastDose:dose?.dosed_at||null,doseMl:dose?.dose_ml!=null?Number(dose.dose_ml):null,fertilizerName:name});
 }
 if(!aquariums.length)return null;
 const doseAfterMeasurement=!!state?.lastDose&&(!state.lastMeasurement||new Date(state.lastDose).getTime()>new Date(state.lastMeasurement).getTime());
 const hours=state?.lastDose?Math.max(0,(Date.now()-new Date(state.lastDose).getTime())/3600000):null;
 return <section className="card">
  <div className="toolbar"><label>Bezpečnostná kontrola dávkovania <select value={aquariumId} onChange={e=>setAquariumId(e.target.value)}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>
  {doseAfterMeasurement?<div className="notice"><AlertTriangle size={17}/><b>Po poslednom meraní už bolo pridané hnojivo.</b><p>{state?.fertilizerName?`${state.fertilizerName}${state.doseMl!=null?` · ${state.doseMl} ml`:''}`:'Hnojivo'} bolo zaznamenané {state?.lastDose?new Date(state.lastDose).toLocaleString('sk-SK'):''}{hours!=null?` (pred ${hours<1?'menej než hodinou':`${Math.floor(hours)} h`})`:''}.</p><p style={{marginBottom:0}}><b>Pred ďalšou korekčnou dávkou vykonaj nové meranie.</b> Posledné namerané hodnoty už nemusia zodpovedať aktuálnym koncentráciám živín a opakovanie dávky podľa nich môže viesť k predávkovaniu.</p></div>:state?.lastMeasurement?<div className="notice"><FlaskConical size={17}/> Posledné meranie je novšie než posledná evidovaná dávka hnojiva. Odporúčania môžu vychádzať z aktuálnejšieho merania.</div>:<div className="notice"><AlertTriangle size={17}/> Pred korekčným hnojením odporúčame najprv uložiť aktuálne meranie vody.</div>}
 </section>;
}
