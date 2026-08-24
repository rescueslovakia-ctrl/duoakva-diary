"use client";
import {Waves,ChevronDown} from "lucide-react";

export type AquariumContextItem={id:string;name:string;net_volume_l?:number};

export default function AquariumContextSwitcher({aquariums,value,onChange,label="Aktívne akvárium"}:{aquariums:AquariumContextItem[];value:string;onChange:(id:string)=>void;label?:string}){
 const current=aquariums.find(a=>a.id===value);
 return <div className="aquarium-context-switcher">
  <div className="aquarium-context-icon"><Waves size={22}/></div>
  <label>
   <small>{label}</small>
   <span className="aquarium-context-select-wrap">
    <select value={value} onChange={e=>onChange(e.target.value)} aria-label={label}>
     {aquariums.map(a=><option key={a.id} value={a.id}>{a.name}{a.net_volume_l?` · ${a.net_volume_l} l`:''}</option>)}
    </select>
    <ChevronDown size={18}/>
   </span>
   {current&&<span className="aquarium-context-hint">Všetky údaje nižšie patria k tejto nádrži.</span>}
  </label>
 </div>;
}
