"use client";

import {useState} from "react";
import {createClient,isSupabaseConfigured} from "@/lib/supabase/client";

function localizeAuthError(message:string){
 const normalized=message.toLowerCase();
 if(normalized.includes("new password should be different from the old password")||normalized.includes("same password"))return "Nové heslo musí byť odlišné od pôvodného hesla.";
 if(normalized.includes("password should be at least"))return "Heslo je príliš krátke.";
 return message;
}

export default function ResetPasswordPage(){
 const[password,setPassword]=useState("");
 const[confirmPassword,setConfirmPassword]=useState("");
 const[msg,setMsg]=useState("");
 const[busy,setBusy]=useState(false);
 const[done,setDone]=useState(false);

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  setMsg("");
  if(!isSupabaseConfigured()){setMsg("Služba prihlásenia momentálne nie je dostupná.");return}
  if(password.length<8){setMsg("Heslo musí mať aspoň 8 znakov.");return}
  if(password!==confirmPassword){setMsg("Heslá sa nezhodujú.");return}
  setBusy(true);
  try{
   const s=createClient();
   const{data:{session}}=await s.auth.getSession();
   if(!session){setMsg("Odkaz na obnovu hesla nie je platný alebo jeho platnosť vypršala. Požiadaj o nový odkaz.");return}
   const{error}=await s.auth.updateUser({password});
   if(error){setMsg(localizeAuthError(error.message));return}
   setDone(true);
   setMsg("Heslo bolo úspešne zmenené. Teraz sa môžeš prihlásiť novým heslom.");
  }catch(error){setMsg(error instanceof Error?localizeAuthError(error.message):"Heslo sa nepodarilo zmeniť. Skús to prosím znova.")}
  finally{setBusy(false)}
 }

 return <main className="auth"><section className="card"><a href="/" style={{textDecoration:"none"}}><small>← DUOAKVA DIARY</small></a><h1>Nové heslo</h1><p className="muted">Nastav si nové heslo k svojmu účtu DuoAkva Diary.</p>{!done&&<form onSubmit={submit} className="form one"><label>Nové heslo<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label>Potvrď nové heslo<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} disabled={busy}/></label><button className="primary" disabled={busy}>{busy?"Ukladám…":"Zmeniť heslo"}</button></form>}{msg&&<div className="notice">{msg}</div>}{done&&<div className="form-actions"><a href="/auth">Prejsť na prihlásenie</a></div>}<div className="app-legal-footer"><div><a href="/ochrana-osobnych-udajov">Ochrana osobných údajov</a> · <a href="/cookies">Cookies</a> · <a href="/podmienky-pouzivania">Podmienky používania</a></div></div></section></main>;
}
