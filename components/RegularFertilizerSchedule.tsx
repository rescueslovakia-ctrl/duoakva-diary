"use client";
import {useEffect,useState} from "react";
import {CalendarDays,Clock3,Droplets,ChevronDown,Check,Settings2} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {doseNutrients,formatNutrients,nutrientLabels,type NutrientAssignment} from "@/lib/doseNutrients";
import type {Aquarium} from "@/components/AquariumsModule";
type Assignment=NutrientAssignment & {id:string;custom_name?:string|null;available:boolean;fertilizer_catalog?:NonNullable<NutrientAssignment['fertilizer_catalog']> & {manufacturer?:string|null;product_name:string}|null};
type Plan={id?:string;head:number;aquarium_fertilizer_id:string;dose_ml:string;local_time:string;timezone:string;weekdays:number[];enabled:boolean;next_run_at?:string|null;dirty?:boolean};
const days=['Po','Ut','St','Št','Pi','So','Ne'];
const blank=(head:number):Plan=>({head,aquarium_fertilizer_id:'',dose_ml:'',local_time:'08:00',timezone:'Europe/Bratislava',weekdays:[1,2,3,4,5,6,7],enabled:false});
const nameOf=(a:Assignment)=>a.custom_name||`${a.fertilizer_catalog?.manufacturer||''} ${a.fertilizer_catalog?.product_name||'Hnojivo'}`.trim();
export default function RegularFertilizerSchedule({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||'');
 const[activeHead,setActiveHead]=useState<number|null>(1);
 const[items,setItems]=useState<Assignment[]>([]),[plans,setPlans]=useState<Plan[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{
  let alive=true;setLoading(true);setError('');setMessage('');setItems([]);setPlans([]);
  if(!aquariumId){setLoading(false);return;}
  (async()=>{try{
   const s=createClient();const[a,p]=await Promise.all([
    s.from('aquarium_fertilizers').select('id,custom_name,custom_nutrient_effects,available,fertilizer_catalog(manufacturer,product_name,reference_dose_ml,reference_liters,nutrient_effects,verification_status)').eq('aquarium_id',aquariumId).order('created_at'),
    s.from('fertilizer_schedules').select('*').eq('aquarium_id',aquariumId).order('head')
   ]);
   if(!alive)return;
   if(a.error||p.error){setError('Plán sa nepodarilo načítať. Skús obnoviť načítanie.');return;}
   setItems((a.data||[]) as unknown as Assignment[]);
   setPlans([1,2,3,4].map(head=>{const row=p.data?.find(x=>x.head===head);return row?{...row,dose_ml:String(row.dose_ml),local_time:String(row.local_time).slice(0,5),dirty:false}:blank(head)}));
  }catch{if(alive)setError('Plán sa nepodarilo načítať. Skús obnoviť načítanie.');}finally{if(alive)setLoading(false);}})();
  return()=>{alive=false;};
 },[aquariumId,revision]);
 const aq=aquariums.find(a=>a.id===aquariumId);
 function change(head:number,patch:Partial<Plan>){setMessage('');setPlans(v=>v.map(p=>p.head===head?{...p,...patch,dirty:true}:p));}
 async function save(p:Plan){
  setMessage('');const ml=Number(p.dose_ml),item=items.find(a=>a.id===p.aquarium_fertilizer_id);
  if(!item||!Number.isFinite(ml)||ml<=0||ml>10000||!/^\d{2}:\d{2}$/.test(p.local_time)||!p.weekdays.length){setMessage(`Hlavica ${p.head}: vyber hnojivo, kladnú dávku, čas a aspoň jeden deň.`);return;}
  if(p.enabled&&!item.available){setMessage('Hnojivo nie je dostupné. Najprv ho zapni v zozname hnojív alebo vyber iné.');return;}
  setBusy(p.head);
  try{
   const payload={aquarium_id:aquariumId,aquarium_fertilizer_id:p.aquarium_fertilizer_id,head:p.head,dose_ml:ml,local_time:p.local_time,timezone:p.timezone,weekdays:[...p.weekdays].sort((a,b)=>a-b),enabled:p.enabled};
   const s=createClient();const query=p.id?s.from('fertilizer_schedules').update(payload).eq('id',p.id).eq('aquarium_id',aquariumId):s.from('fertilizer_schedules').insert(payload);
   const{data,error:err}=await query.select('*').single();
   if(err){setMessage('Plán sa nepodarilo uložiť. Nastavenie zostalo neuložené.');return;}
   setPlans(v=>v.map(x=>x.head===p.head?{...data,dose_ml:String(data.dose_ml),local_time:String(data.local_time).slice(0,5),dirty:false}:x));
   setMessage(`Hlavica ${p.head}: plán uložený. Automatický zápis je ${data.enabled?'zapnutý':'vypnutý'}.`);
  }catch{setMessage('Plán sa nepodarilo uložiť. Skús to znova.');}finally{setBusy(null);}
 }
 if(!aquariums.length)return <section className="card"><h3>Pravidelný režim</h3><p>Najprv vytvor akvárium.</p></section>;
 return <section className="card dosing-console">
  <header className="dosing-console-header"><div><span className="dosing-eyebrow">PRAVIDELNÝ REŽIM</span><h3><Droplets size={22}/> Dávkovací plán</h3></div><span className="dosing-head-count">4 hlavice</span></header>
  <p className="dosing-description">Nastav plán podľa svojho dávkovača. Diary automaticky eviduje dávky; fyzické podanie nepotvrdzuje.</p>
  <label className="dosing-aquarium">Akvárium<select disabled={busy!==null} value={aquariumId} onChange={e=>{if(plans.some(p=>p.dirty)&&!confirm('Zmeniť akvárium a zahodiť neuložené úpravy?'))return;setAquariumId(e.target.value)}}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name} · {a.net_volume_l} l</option>)}</select></label>
  {loading?<p role="status">Načítavam plán…</p>:error?<div className="dosing-message" role="alert">{error} <button onClick={()=>setRevision(v=>v+1)}>Obnoviť načítanie</button></div>:<>
   <nav className="dosing-pump" aria-label="Výber dávkovacej hlavice">{plans.map(p=><button type="button" className={`dosing-pump-head ${activeHead===p.head?'selected':''}`} key={p.head} aria-label={`Upraviť hlavicu ${p.head}`} aria-pressed={activeHead===p.head} onClick={()=>setActiveHead(p.head)}><span className={`dosing-pump-number ${p.enabled?'on':''}`}>{p.head}</span><span className="dosing-pump-caption">{p.dirty?'Neuložené':p.enabled?'Zapnutá':'Vypnutá'}</span></button>)}</nav>
   <div className="dosing-cards">{plans.map(p=>{
    const item=items.find(a=>a.id===p.aquarium_fertilizer_id),ml=Number(p.dose_ml),values=doseNutrients(item,ml,Number(aq?.net_volume_l)),expanded=activeHead===p.head;
    const frequency=p.weekdays.length===7?'Denne':p.weekdays.length?p.weekdays.slice().sort((a,b)=>a-b).map(d=>days[d-1]).join(' · '):'Vyber dni';
    return <article className={`dosing-channel ${expanded?'expanded':''}`} key={`${aquariumId}-${p.head}`}>
     <div className="dosing-channel-header"><span className="dosing-channel-number">{p.head}</span><div className="dosing-channel-title"><h4>{item?nameOf(item):`Hlavica ${p.head}`}</h4><span className={`dosing-channel-status ${p.enabled&&!p.dirty?'on':''}`}>{p.dirty?'Neuložené zmeny':p.enabled?'Automatický zápis zapnutý':'Automatický zápis vypnutý'}</span></div><button type="button" className="dosing-edit" aria-label={`${expanded?'Zavrieť':'Upraviť'} hlavicu ${p.head}`} aria-expanded={expanded} aria-controls={`dosing-editor-${p.head}`} onClick={()=>setActiveHead(expanded?null:p.head)}><Settings2 size={18}/></button></div>
     <div className="dosing-channel-meta"><span><Droplets size={16}/><b>{ml>0?ml.toLocaleString('sk-SK',{maximumFractionDigits:2}):'—'} ml</b></span><span>{frequency}</span><span><Clock3 size={16}/>{p.local_time}</span></div>
     <div className="dosing-nutrients">{values?Object.entries(values).filter(([code])=>nutrientLabels[code]).map(([code,value])=><span key={code}>{formatNutrients({[code]:value,...(values.__estimated===1?{__estimated:1}:{})})}</span>):<span className="dosing-unknown">{!item?'Vyber hnojivo a nastav dávku.':!(ml>0)?'Zadaj dávku pre výpočet živín.':'Prírastok živín nie je overený.'}</span>}</div>
     {values?.__estimated===1&&<p className="dosing-volume">Odhad pri hustote 1 g/ml.</p>}
     {expanded?<form id={`dosing-editor-${p.head}`} className="dosing-editor" onSubmit={e=>{e.preventDefault();save(p)}}>
      <fieldset disabled={busy!==null}><div className="dosing-fields">
       <label className="dosing-full">Hnojivo<select required value={p.aquarium_fertilizer_id} onChange={e=>change(p.head,{aquarium_fertilizer_id:e.target.value})}><option value="">Vyber hnojivo</option>{items.filter(a=>a.available||a.id===p.aquarium_fertilizer_id).map(a=><option key={a.id} value={a.id}>{nameOf(a)}{!a.available?' · nedostupné':''}</option>)}</select></label>
       <label>Dávka pri jednom podaní<input type="number" required min="0.01" max="10000" step="0.01" placeholder="ml" value={p.dose_ml} onChange={e=>change(p.head,{dose_ml:e.target.value})}/></label>
       <label>Čas dávkovania<input type="time" required value={p.local_time} onChange={e=>change(p.head,{local_time:e.target.value})}/></label>
       <label className="dosing-dose-slider dosing-full">Dávka v ml<input type="range" min="0.1" max={Math.max(10,Math.ceil((ml||1)/5)*5)} step="0.1" value={ml||0.1} onChange={e=>change(p.head,{dose_ml:e.target.value})}/><span><span>0,1 ml</span><b>{ml>0?ml.toLocaleString('sk-SK',{maximumFractionDigits:2}):'—'} ml</b><span>{Math.max(10,Math.ceil((ml||1)/5)*5)} ml</span></span></label>
       <label>Frekvencia<select value={p.weekdays.length===7?'daily':'selected'} onChange={e=>change(p.head,{weekdays:e.target.value==='daily'?[1,2,3,4,5,6,7]:[1,3,5]})}><option value="daily">Denne</option><option value="selected">Vybrané dni</option></select></label>
       <label>Časové pásmo<select value={p.timezone} onChange={e=>change(p.head,{timezone:e.target.value})}>{Array.from(new Set(['Europe/Bratislava','UTC',p.timezone])).map(zone=><option key={zone} value={zone}>{zone==='Europe/Bratislava'?'Slovensko':zone}</option>)}</select></label>
       <div className="dosing-days dosing-full" role="group" aria-label={`Dni dávkovania hlavice ${p.head}`}>{days.map((day,i)=><button type="button" aria-pressed={p.weekdays.includes(i+1)} key={day} onClick={()=>change(p.head,{weekdays:p.weekdays.includes(i+1)?p.weekdays.filter(d=>d!==i+1):[...p.weekdays,i+1]})}>{day}</button>)}</div>
       <label className="dosing-switch-row dosing-full"><span>Automatický zápis<span>Platí po uložení hlavice</span></span><input className="dosing-switch" role="switch" type="checkbox" checked={p.enabled} onChange={e=>change(p.head,{enabled:e.target.checked})}/></label>
       <button className="dosing-save dosing-full" disabled={busy!==null}><Check size={17}/>{busy===p.head?'Ukladám…':'Uložiť hlavicu'}</button>
      </div></fieldset>
      <p className="dosing-volume">Vypočítané živiny pre {aq?.net_volume_l} l vody. Ide o prírastok po dávke, nie meranie vody.</p>
     </form>:<button type="button" className="dosing-expand" onClick={()=>setActiveHead(p.head)}>Upraviť plán <ChevronDown size={16}/></button>}
     {!p.dirty&&p.enabled&&p.next_run_at&&<p className="dosing-next"><Clock3 size={14}/> Najbližší zápis: {new Date(p.next_run_at).toLocaleString('sk-SK',{timeZone:p.timezone})}</p>}
    </article>;
   })}</div>
  </>}
  {message&&<div className="dosing-message" role="status">{message}</div>}
  <p className="dosing-footnote"><CalendarDays size={15}/> Plán sa zapisuje aj pri zatvorenej aplikácii. Zmeny platia od nasledujúceho termínu.</p>
 </section>;
}
