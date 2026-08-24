"use client";
import {useState} from "react";
import {MessageCircle,X,Send} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

export default function FeedbackBubble({userId,email,page}:{userId:string;email:string;page:string}){
 const[open,setOpen]=useState(false);const[category,setCategory]=useState<'feedback'|'bug'|'idea'>('feedback');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);const[msg,setMsg]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();const text=message.trim();if(text.length<3){setMsg('Napíš prosím aspoň krátku správu.');return}setBusy(true);setMsg('');const s=createClient();const{error}=await s.from('user_feedback').insert({user_id:userId,email:email||null,category,message:text,page});setBusy(false);if(error){setMsg('Feedback sa nepodarilo odoslať. Skús to prosím znova.');return}setMessage('');setCategory('feedback');setMsg('Ďakujeme. Feedback bol odoslaný.');}
 if(!userId)return null;
 return <><button className="feedback-fab" onClick={()=>setOpen(v=>!v)} aria-label="Poslať feedback">{open?<X size={21}/>:<MessageCircle size={21}/>}</button>{open&&<section className="feedback-panel"><div className="section-head"><div><small>DUOAKVA DIARY</small><h3>Feedback</h3></div><button onClick={()=>setOpen(false)} aria-label="Zavrieť"><X size={16}/></button></div><p className="muted">Našiel si chybu alebo máš nápad na zlepšenie? Napíš nám priamo odtiaľto.</p><form className="form one" onSubmit={submit}><label>Typ<select value={category} onChange={e=>setCategory(e.target.value as any)}><option value="feedback">Spätná väzba</option><option value="bug">Nahlásiť chybu</option><option value="idea">Nápad na funkciu</option></select></label><label>Správa<textarea maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Čo by sme mali opraviť alebo zlepšiť?"/></label><small className="muted">Aktuálna sekcia: {page}</small><button className="primary" disabled={busy}><Send size={15}/>{busy?' Odosielam…':' Odoslať feedback'}</button></form>{msg&&<div className="notice">{msg}</div>}</section>}</>;
}
