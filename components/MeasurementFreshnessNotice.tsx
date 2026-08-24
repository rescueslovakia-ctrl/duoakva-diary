"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

export default function MeasurementFreshnessNotice({aquariums}:{aquariums:Aquarium[]}){
 const[stale,setStale]=useState<string[]>([]);
 useEffect(()=>{let alive=true;(async()=>{if(!aquariums.length){setStale([]);return}const s=createClient();const{data,error}=await s.from('measurement_sessions').select('aquarium_id,measured_at,context_reset_maintenance_id').in('aquarium_id',aquariums.map(a=>a.id)).order('measured_at',{ascending:false}).limit(Math.max(50,aquariums.length*10));if(error||!alive)return;const latest=new Map<string,any>();for(const r of data||[])if(!latest.has(r.aquarium_id))latest.set(r.aquarium_id,r);setStale(aquariums.filter(a=>latest.get(a.id)?.context_reset_maintenance_id).map(a=>a.name))})();return()=>{alive=false}},[aquariums]);
 if(!stale.length)return null;
 return <div className="notice"><b>💧 Po poslednom meraní prebehla výmena vody.</b><p>Predchádzajúce hodnoty už nemusia zodpovedať aktuálnemu stavu {stale.length===1?'nádrže':'nádrží'} <b>{stale.join(', ')}</b>. Pre čo najpresnejšie a bezpečné odporúčania vykonaj nové meranie. Do jeho uloženia DuoAkva Diary staré hodnoty nepoužíva ako aktuálny stav.</p><small className="muted">História pôvodných meraní zostáva zachovaná.</small></div>;
}
