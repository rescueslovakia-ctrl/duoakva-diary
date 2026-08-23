"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type DiscoveryResult = {
  scientific_name?: string; common_name?: string; category?: string; adult_size_cm?: number;
  min_tank_l?: number; min_group_size?: number; recommended_group_size?: number;
  temperature_min?: number; temperature_max?: number; ph_min?: number; ph_max?: number;
  gh_min?: number; gh_max?: number; kh_min?: number; kh_max?: number;
  temperament?: string; difficulty?: string; shrimp_safe?: boolean; shrimp_safety_note?: string;
  snail_safe?: boolean; plant_safe?: boolean; diet?: string; notes?: string;
  source_name?: string; source_url?: string; verification_status?: string;
  confidence?: "high" | "medium" | "low"; match_label?: string;
};

type Props={name:string;category:string;existing?:DiscoveryResult|null;onUse:(result:DiscoveryResult)=>void};
const categoryLabels:Record<string,string>={fish:"Ryba",shrimp:"Kreveta",snail:"Slimák",crab:"Krab",crayfish:"Rak",amphibian:"Obojživelník",other:"Živočích"};
const fields:(keyof DiscoveryResult)[]=["adult_size_cm","min_tank_l","min_group_size","recommended_group_size","temperature_min","temperature_max","ph_min","ph_max","gh_min","gh_max","kh_min","kh_max","temperament","diet","difficulty","shrimp_safe","snail_safe","plant_safe"];
const missing=(x?:DiscoveryResult|null)=>!x?fields.length:fields.filter(k=>x[k]===undefined||x[k]===null||x[k]==="").length;
function mergeMissing(base:DiscoveryResult|undefined|null,found:DiscoveryResult){if(!base)return found;const out:any={...base};for(const[k,v]of Object.entries(found))if((out[k]===undefined||out[k]===null||out[k]==="")&&v!==undefined&&v!==null&&v!=="")out[k]=v;out.source_name=found.source_name||base.source_name;out.source_url=found.source_url||base.source_url;out.verification_status=found.verification_status||base.verification_status;return out as DiscoveryResult}

export default function LivestockDiscovery({name,category,existing,onUse}:Props){
 const[loading,setLoading]=useState(false),[error,setError]=useState(""),[results,setResults]=useState<DiscoveryResult[]>([]);
 const incomplete=useMemo(()=>missing(existing)>0,[existing]);
 async function discover(){const q=name.trim();if(q.length<3){setError("Zadaj aspoň 3 znaky názvu živočícha.");return}setLoading(true);setError("");setResults([]);try{const r=await fetch(`/api/livestock-discovery?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);const data=await r.json();if(!r.ok)throw new Error(data?.error||"Online dohľadanie sa nepodarilo.");const list=Array.isArray(data)?data:Array.isArray(data?.items)?data.items:Array.isArray(data?.results)?data.results:data?.result?[data.result]:[];setResults(list);if(!list.length)setError(data?.message||"Nenašla sa spoľahlivá zhoda. Skús slovenský, obchodný alebo vedecký názov.")}catch(e:any){setError(e?.message||"Online dohľadanie sa nepodarilo.")}finally{setLoading(false)}}
 const range=(a?:number,b?:number,unit="")=>a==null&&b==null?"—":a!=null&&b!=null?`${a}–${b}${unit}`:`do ${a??b}${unit}`;
 return <div style={{marginTop:12}}>
  <button type="button" onClick={discover} disabled={loading||name.trim().length<3}><Search size={16}/> {loading?"Dohľadávam…":existing&&incomplete?"Doplniť chýbajúce údaje online":"Dohľadať údaje online"}</button>
  {existing&&incomplete&&<p className="muted" style={{marginTop:6}}>Záznam nie je úplný. Online dohľadanie doplní iba chýbajúce údaje a zachová už uložené hodnoty.</p>}
  {error&&<p className="muted" style={{marginTop:8}}>{error}</p>}
  {results.map((x,i)=>{const merged=mergeMissing(existing,x),before=missing(existing),after=missing(merged),added=Math.max(0,before-after);return <div key={`${x.scientific_name||x.common_name||i}-${i}`} className="catalog-result" style={{marginTop:10,alignItems:"flex-start"}}><div style={{flex:1}}>
   <b>{x.common_name||x.scientific_name||"Nájdený živočích"}</b>{x.common_name&&x.scientific_name&&<p><i>{x.scientific_name}</i></p>}
   <p className="muted">{categoryLabels[x.category||category]||"Živočích"} · {x.match_label||"Online zhoda"}{x.source_name?` · Zdroj: ${x.source_name}`:""}</p>
   <p className="muted">Teplota {range(x.temperature_min,x.temperature_max," °C")} · pH {range(x.ph_min,x.ph_max)} · GH {range(x.gh_min,x.gh_max," °dGH")} · KH {range(x.kh_min,x.kh_max," °dKH")}</p>
   {(x.min_tank_l!=null||x.min_group_size!=null||x.adult_size_cm!=null)&&<p className="muted">{x.adult_size_cm!=null?`Max. veľkosť ${x.adult_size_cm} cm · `:""}{x.min_tank_l!=null?`nádrž od ${x.min_tank_l} l · `:""}{x.min_group_size!=null?`min. skupina ${x.min_group_size} ks`:""}</p>}
   {x.shrimp_safety_note&&<p>🦐 {x.shrimp_safety_note}</p>}{x.notes&&<p className="muted">{x.notes}</p>}
   <p className="muted">{existing?added>0?`Doplní ${added} chýbajúcich údajov. Existujúce hodnoty zostanú zachované.`:"Tento výsledok nepridáva žiadne nové údaje.":"Údaje sa uložia až po tvojom potvrdení."}</p>
  </div><button type="button" className="primary" disabled={!!existing&&added===0} onClick={()=>onUse(merged)}>{existing?"Doplniť údaje":"Použiť nájdené údaje"}</button></div>})}
 </div>
}
