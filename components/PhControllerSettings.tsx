"use client";
import {useEffect,useState} from "react";
import {Gauge} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {Aquarium} from "@/components/AquariumsModule";

type Controller={id:string;category:string;manufacturer?:string|null;model:string;notes?:string|null;settings:any};
const isPhController=(x:Controller)=>{const text=`${x.manufacturer||''} ${x.model||''} ${x.notes||''}`.toLowerCase();return (x.category==='controller'&&/(ph|co2|co₂)/i.test(text))||(x.category==='co2'&&/(controller|control|ph)/i.test(text));};

export default function PhControllerSettings({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||'');const[controllers,setControllers]=useState<Controller[]>([]);const[values,setValues]=useState<Record<string,string>>({});const[msg,setMsg]=useState('');const[busy,setBusy]=useState<string|null>(null);
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{if(aquariumId)load()},[aquariumId]);
 async function load(){const{data,error}=await createClient().from('aquarium_equipment').select('id,category,manufacturer,model,notes,settings').eq('aquarium_id',aquariumId).eq('active',true).order('created_at');if(error){setMsg('Nastavenie pH controlleru sa nepodarilo načítať.');return}const list=((data||[]) as Controller[]).filter(isPhController);setControllers(list);setValues(Object.fromEntries(list.map(x=>[x.id,x.settings?.ph_setpoint!=null?String(x.settings.ph_setpoint):''])));setMsg('')}
 async function save(x:Controller){const raw=values[x.id];if(raw===''){setMsg('Zadaj nastavené pH controlleru.');return}const ph=Number(raw);if(!Number.isFinite(ph)||ph<3||ph>10){setMsg('Zadaj platnú hodnotu pH v rozsahu 3,0 až 10,0.');return}setBusy(x.id);const settings={...(x.settings||{}),ph_setpoint:ph};const{error}=await createClient().from('aquarium_equipment').update({settings}).eq('id',x.id);setBusy(null);if(error){setMsg('Nastavené pH sa nepodarilo uložiť.');return}setMsg(`Nastavené pH ${ph.toFixed(2)} bolo uložené.`);await load()}
 if(!aquariums.length||!controllers.length)return null;
 return <section className="card"><div className="section-head"><div><small>TECHNIKA</small><h3><Gauge size={18}/> Nastavenie pH regulácie</h3></div></div><p className="muted">Ak pH controller automaticky riadi CO₂, zadaj jeho cieľovú hodnotu. DuoAkva Diary ju použije pri hodnotení pH a pri odporúčaní ďalších meraní.</p><div className="form one"><label>Akvárium<select value={aquariumId} onChange={e=>setAquariumId(e.target.value)}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>{controllers.map(x=><div className="measurement-row" key={x.id}><div><b>{`${x.manufacturer||''} ${x.model}`.trim()}</b><small>Rozpoznaný pH / CO₂ controller</small></div><div className="form-actions"><input style={{maxWidth:120}} type="number" step="0.01" min="3" max="10" placeholder="napr. 6.50" value={values[x.id]||''} onChange={e=>setValues(v=>({...v,[x.id]:e.target.value}))}/><button className="primary" type="button" disabled={busy===x.id} onClick={()=>save(x)}>{busy===x.id?'Ukladám…':'Uložiť pH'}</button></div></div>)}{msg&&<div className="notice">{msg}</div>}</section>;
}
