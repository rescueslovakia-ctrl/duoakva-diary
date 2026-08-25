"use client";

// PREPARATION-ONLY COMPONENT. Not imported by the production app.
// Intended placement later: fertilizer/product detail -> "Nahlásiť chybné dávkovanie"

import {useState} from "react";

type Props={
 entityType:'fertilizer'|'plant'|'livestock'|'equipment';
 entityKey:string;
 entityLabel:string;
 fieldKey?:string;
 currentValue?:string|null;
 onSubmit?:(payload:any)=>Promise<void>;
};

export default function CatalogCorrectionReport({entityType,entityKey,entityLabel,fieldKey,currentValue,onSubmit}:Props){
 const[proposedValue,setProposedValue]=useState('');
 const[labelText,setLabelText]=useState('');
 const[note,setNote]=useState('');
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState('');
 const reportType=entityType==='fertilizer'?'incorrect_dosage':'incorrect_data';
 async function submit(e:React.FormEvent){e.preventDefault();if(!proposedValue.trim())return;setBusy(true);setMsg('');try{await onSubmit?.({entity_type:entityType,entity_key:entityKey,report_type:reportType,field_key:fieldKey||null,current_value:currentValue||null,proposed_value:proposedValue.trim(),package_label_text:labelText.trim()||null,user_note:note.trim()||null});setMsg('Ďakujeme. Hlásenie bolo odoslané na kontrolu administrátorovi.');setProposedValue('');setLabelText('');setNote('')}catch{setMsg('Hlásenie sa nepodarilo odoslať.')}finally{setBusy(false)}}
 return <section className="card"><h3>{entityType==='fertilizer'?'Nahlásiť chybné dávkovanie':'Nahlásiť nesprávny údaj'}</h3><p><b>{entityLabel}</b></p>{currentValue&&<p>Aktuálny údaj v DuoAkva: <b>{currentValue}</b></p>}<form className="form one" onSubmit={submit}><label>Správny údaj podľa obalu alebo výrobcu<input value={proposedValue} onChange={e=>setProposedValue(e.target.value)} placeholder={entityType==='fertilizer'?'napr. 5 ml / 125 l = +2 mg/l K':'Zadaj správnu hodnotu'}/></label><label>Presný text z etikety (voliteľné)<textarea value={labelText} onChange={e=>setLabelText(e.target.value)} rows={3}/></label><label>Poznámka (voliteľné)<textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}/></label><div className="notice">Hlásenie samo nezmení databázu. Údaj sa zmení až po kontrole a schválení administrátorom. Pri nasadení doplníme aj možnosť priložiť fotografiu etikety.</div><button className="primary" disabled={busy||!proposedValue.trim()}>{busy?'Odosielam…':'Odoslať na kontrolu'}</button></form>{msg&&<div className="notice">{msg}</div>}</section>;
}
