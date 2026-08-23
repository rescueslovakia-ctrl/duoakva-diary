"use client";
import {useEffect,useMemo,useState} from "react";
import {Plus,Trash2,Waves,Filter,PanelTop,Scissors,Sparkles,Wrench,NotebookPen} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

type MaintenanceType="water_change"|"filter_clean"|"glass_clean"|"substrate_clean"|"plant_trim"|"equipment"|"other";
type Row={id:string;aquarium_id:string;maintenance_type:MaintenanceType;custom_type?:string|null;performed_at:string;water_change_l?:number|null;water_change_percent?:number|null;notes?:string|null;created_at:string};
const types:{value:MaintenanceType;label:string;icon:any}[]=[
 {value:"water_change",label:"Výmena vody",icon:Waves},
 {value:"filter_clean",label:"Čistenie filtra",icon:Filter},
 {value:"glass_clean",label:"Čistenie skiel",icon:PanelTop},
 {value:"substrate_clean",label:"Odkalenie / čistenie dna",icon:Sparkles},
 {value:"plant_trim",label:"Strih rastlín",icon:Scissors},
 {value:"equipment",label:"Údržba techniky / CO₂",icon:Wrench},
 {value:"other",label:"Iná údržba",icon:NotebookPen}
];
const labelOf=(t:string,custom?:string|null)=>t==="other"&&custom?custom:(types.find(x=>x.value===t)?.label||t);
function fmtDate(s:string){return new Intl.DateTimeFormat("sk-SK",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(s))}
function daysSince(s?:string){if(!s)return null;return Math.max(0,Math.floor((Date.now()-new Date(s).getTime())/86400000))}

export default function MaintenanceModule({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||"");
 const[rows,setRows]=useState<Row[]>([]);const[show,setShow]=useState(false);const[busy,setBusy]=useState(false);const[msg,setMsg]=useState("");
 const[type,setType]=useState<MaintenanceType>("water_change");const[customType,setCustomType]=useState("");const[date,setDate]=useState(new Date().toISOString().slice(0,16));const[liters,setLiters]=useState("");const[notes,setNotes]=useState("");
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{if(aquariumId)load()},[aquariumId]);
 const aq=aquariums.find(a=>a.id===aquariumId);const percent=aq&&Number(liters)>0?Math.min(100,Number(liters)/aq.net_volume_l*100):0;
 async function load(){setMsg("");const{data,error}=await createClient().from("aquarium_maintenance").select("*").eq("aquarium_id",aquariumId).order("performed_at",{ascending:false}).limit(200);if(error){setMsg(error.message);setRows([]);return}setRows((data||[]) as Row[])}
 function reset(){setShow(false);setType("water_change");setCustomType("");setDate(new Date().toISOString().slice(0,16));setLiters("");setNotes("")}
 async function save(e:React.FormEvent){e.preventDefault();if(!aquariumId)return;setBusy(true);const water=type==="water_change"&&Number(liters)>0?Number(liters):null;const payload={aquarium_id:aquariumId,maintenance_type:type,custom_type:type==="other"?(customType.trim()||"Iná údržba"):null,performed_at:new Date(date).toISOString(),water_change_l:water,water_change_percent:water&&aq?Number((water/aq.net_volume_l*100).toFixed(1)):null,notes:notes.trim()||null};const{error}=await createClient().from("aquarium_maintenance").insert(payload);setBusy(false);if(error)return setMsg(error.message);reset();load()}
 async function remove(id:string){if(!confirm("Odstrániť tento záznam údržby?"))return;const{error}=await createClient().from("aquarium_maintenance").delete().eq("id",id);if(error)return setMsg(error.message);setRows(v=>v.filter(x=>x.id!==id))}
 const latest=useMemo(()=>{const m=new Map<string,Row>();for(const r of rows)if(!m.has(r.maintenance_type))m.set(r.maintenance_type,r);return m},[rows]);
 const recentWater=rows.find(r=>r.maintenance_type==="water_change");const total30=rows.filter(r=>Date.now()-new Date(r.performed_at).getTime()<=30*86400000).length;
 if(!aquariums.length)return <section className="card"><h3>Údržba</h3><p>Najprv vytvor akvárium.</p></section>;
 return <>
  <div className="toolbar"><label>Akvárium <select value={aquariumId} onChange={e=>setAquariumId(e.target.value)}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name} · {a.net_volume_l} l</option>)}</select></label><button className="primary" onClick={()=>setShow(true)}><Plus size={17}/> Zapísať údržbu</button></div>
  {msg&&<div className="notice">{msg}</div>}
  <section className="card"><h3>Prehľad údržby</h3><div className="grid3"><div className="card"><b>Posledná výmena vody</b><p>{recentWater?fmtDate(recentWater.performed_at):"Zatiaľ bez záznamu"}</p>{recentWater?.water_change_l!=null&&<p className="muted">{recentWater.water_change_l} l · {recentWater.water_change_percent?.toFixed?.(1)??recentWater.water_change_percent}%</p>}</div><div className="card"><b>Údržba za 30 dní</b><p style={{fontSize:"1.35rem",fontWeight:700}}>{total30} úkonov</p></div><div className="card"><b>Posledné čistenie filtra</b>{latest.get("filter_clean")?<><p>{fmtDate(latest.get("filter_clean")!.performed_at)}</p><p className="muted">pred {daysSince(latest.get("filter_clean")!.performed_at)} dňami</p></>:<p>Zatiaľ bez záznamu</p>}</div></div></section>
  {show&&<section className="card"><h3>Nový záznam údržby</h3><form className="form" onSubmit={save}><label>Typ údržby<select value={type} onChange={e=>setType(e.target.value as MaintenanceType)}>{types.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>{type==="other"&&<label>Názov údržby<input required value={customType} onChange={e=>setCustomType(e.target.value)} placeholder="Napr. výmena hadíc"/></label>}<label>Dátum a čas<input type="datetime-local" required value={date} onChange={e=>setDate(e.target.value)}/></label>{type==="water_change"&&<><label>Vymenená voda (l)<input type="number" min="0.1" step="0.1" required value={liters} onChange={e=>setLiters(e.target.value)}/></label>{aq&&Number(liters)>0&&<div className="notice">To je približne <b>{percent.toFixed(1)} %</b> z čistého objemu {aq.net_volume_l} l.</div>}</>}<label>Poznámka<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Voliteľné – napr. stav filtra, riasy, použité prípravky…"/></label><div className="form-actions"><button className="primary" disabled={busy}>{busy?"Ukladám…":"Uložiť záznam"}</button><button type="button" onClick={reset}>Zrušiť</button></div></form></section>}
  <section className="card"><h3>História údržby</h3>{rows.length===0?<p>Zatiaľ nie je zapísaná žiadna údržba.</p>:<div style={{display:"grid",gap:10}}>{rows.map(r=>{const cfg=types.find(x=>x.value===r.maintenance_type),I=cfg?.icon||NotebookPen;return <article className="card" key={r.id} style={{display:"flex",gap:12,alignItems:"flex-start",justifyContent:"space-between"}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><I size={18}/><div><b>{labelOf(r.maintenance_type,r.custom_type)}</b><p className="muted">{fmtDate(r.performed_at)}</p>{r.maintenance_type==="water_change"&&r.water_change_l!=null&&<p><b>{r.water_change_l} l</b>{r.water_change_percent!=null?` · ${Number(r.water_change_percent).toFixed(1)} %`:""}</p>}{r.notes&&<p>{r.notes}</p>}</div></div><button className="danger" onClick={()=>remove(r.id)} title="Odstrániť"><Trash2 size={15}/></button></article>})}</div>}</section>
 </>;
}
