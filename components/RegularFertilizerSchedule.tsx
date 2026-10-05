"use client";
import {useEffect,useState} from "react";
import {CalendarDays} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {doseNutrients,formatNutrients,type NutrientAssignment} from "@/lib/doseNutrients";
import type {Aquarium} from "@/components/AquariumsModule";
type Assignment=NutrientAssignment & {id:string;custom_name?:string|null;available:boolean;fertilizer_catalog?:NonNullable<NutrientAssignment['fertilizer_catalog']> & {manufacturer?:string|null;product_name:string}|null};
type Plan={id?:string;head:number;aquarium_fertilizer_id:string;dose_ml:string;local_time:string;timezone:string;weekdays:number[];enabled:boolean;next_run_at?:string|null;dirty?:boolean};
const days=['Po','Ut','St','Št','Pi','So','Ne'];
const blank=(head:number):Plan=>({head,aquarium_fertilizer_id:'',dose_ml:'',local_time:'08:00',timezone:'Europe/Bratislava',weekdays:[1,2,3,4,5,6,7],enabled:false});
const nameOf=(a:Assignment)=>a.custom_name||`${a.fertilizer_catalog?.manufacturer||''} ${a.fertilizer_catalog?.product_name||'Hnojivo'}`.trim();
export default function RegularFertilizerSchedule({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||'');
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
 return <section className="card"><div className="section-head"><h3><CalendarDays size={18}/> Automatický plán hnojenia</h3></div>
  <p className="muted">Nastav rovnaké dávky a časy ako v aplikácii dávkovača. Diary podľa plánu automaticky zapisuje dávky aj pri zatvorenej aplikácii. Dávkovač fyzicky neovláda a nepotvrdzuje skutočné podanie.</p>
  <div className="form one"><label>Akvárium<select disabled={busy!==null} value={aquariumId} onChange={e=>{if(plans.some(p=>p.dirty)&&!confirm('Zmeniť akvárium a zahodiť neuložené úpravy?'))return;setAquariumId(e.target.value)}}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name} · {a.net_volume_l} l</option>)}</select></label></div>
  {loading?<p role="status">Načítavam plán…</p>:error?<div className="notice" role="alert">{error} <button onClick={()=>setRevision(v=>v+1)}>Obnoviť načítanie</button></div>:<div style={{display:'grid',gap:16,marginTop:16}}>{plans.map(p=>{
   const item=items.find(a=>a.id===p.aquarium_fertilizer_id),values=doseNutrients(item,Number(p.dose_ml),Number(aq?.net_volume_l));
   return <form className="card" key={`${aquariumId}-${p.head}`} onSubmit={e=>{e.preventDefault();save(p)}}>
    <h4>Hlavica {p.head} · {p.dirty?'Neuložené zmeny':p.enabled?'Zapnutá':'Vypnutá'}</h4>
    <fieldset disabled={busy!==null} style={{border:0,padding:0,margin:0,minWidth:0}}><div className="form">
     <label>Hnojivo<select required value={p.aquarium_fertilizer_id} onChange={e=>change(p.head,{aquarium_fertilizer_id:e.target.value})}><option value="">Vyber hnojivo</option>{items.filter(a=>a.available||a.id===p.aquarium_fertilizer_id).map(a=><option key={a.id} value={a.id}>{nameOf(a)}{!a.available?' · nedostupné':''}</option>)}</select></label>
     <label>Dávka pri jednom podaní (ml)<input type="number" required min="0.01" max="10000" step="0.01" value={p.dose_ml} onChange={e=>change(p.head,{dose_ml:e.target.value})}/></label>
     <div className="notice" style={{gridColumn:'1/-1'}}><b>Živiny dodané jednou dávkou</b><p>{formatNutrients(values)}</p><small>Pre čistý objem {aq?.net_volume_l} l. Ide o vypočítaný prírastok, nie výsledok merania vody.</small></div>
     <label>Čas dávkovania<input type="time" required value={p.local_time} onChange={e=>change(p.head,{local_time:e.target.value})}/></label>
     <label>Časové pásmo<select value={p.timezone} onChange={e=>change(p.head,{timezone:e.target.value})}>{Array.from(new Set(['Europe/Bratislava','UTC',p.timezone])).map(zone=><option key={zone} value={zone}>{zone==='Europe/Bratislava'?'Slovensko (letný a zimný čas)':zone}</option>)}</select></label>
     <label>Frekvencia<select value={p.weekdays.length===7?'daily':'selected'} onChange={e=>change(p.head,{weekdays:e.target.value==='daily'?[1,2,3,4,5,6,7]:[1,3,5]})}><option value="daily">Denne</option><option value="selected">Vybrané dni v týždni</option></select></label>
     {p.weekdays.length!==7&&<div style={{display:'flex',flexWrap:'wrap',gap:12,gridColumn:'1/-1'}}>{days.map((day,i)=><label key={day} style={{display:'flex',alignItems:'center',gap:6}}><input type="checkbox" checked={p.weekdays.includes(i+1)} onChange={e=>change(p.head,{weekdays:e.target.checked?[...p.weekdays,i+1]:p.weekdays.filter(d=>d!==i+1)})}/>{day}</label>)}</div>}
     <label style={{display:'flex',alignItems:'center',gap:8,gridColumn:'1/-1'}}><input type="checkbox" checked={p.enabled} onChange={e=>change(p.head,{enabled:e.target.checked})}/> Zapnúť automatický zápis dávok</label>
     <div className="form-actions"><button className="primary" disabled={busy!==null}>{busy===p.head?'Ukladám…':'Uložiť hlavicu'}</button></div>
    </div></fieldset>
    {!p.dirty&&p.enabled&&p.next_run_at&&<p className="muted">Najbližší zápis: {new Date(p.next_run_at).toLocaleString('sk-SK',{timeZone:p.timezone})} · {p.timezone}</p>}
   </form>;
  })}</div>}
  {message&&<div className="notice" role="status">{message}</div>}
  <p className="muted">Zápisy sú označené „Automatické dávkovanie podľa plánu“. Zapnutie alebo zmena plánu platí pre nasledujúci termín; staršie dávky sa nedopĺňajú. Vypnutie začne platiť po uložení hlavice.</p>
 </section>;
}
