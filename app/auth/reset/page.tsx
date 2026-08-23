"use client";
import {useState} from "react";
import {createClient,isSupabaseConfigured} from "@/lib/supabase/client";

export default function ResetPasswordPage(){
 const[password,setPassword]=useState("");
 const[confirm,setConfirm]=useState("");
 const[msg,setMsg]=useState("");
 const[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setMsg("");
  if(password.length<8){setMsg("Heslo musí mať aspoň 8 znakov.");return}
  if(password!==confirm){setMsg("Heslá sa nezhodujú.");return}
  if(!isSupabaseConfigured()){setMsg("Služba prihlásenia momentálne nie je dostupná.");return}
  setBusy(true);
  try{
   const{error}=await createClient().auth.updateUser({password});
   if(error){setMsg(error.message);return}
   setMsg("Heslo bolo úspešne zmenené. O chvíľu ťa presmerujeme na prihlásenie.");
   setTimeout(()=>window.location.assign("/auth"),1200);
  }catch{setMsg("Heslo sa nepodarilo zmeniť. Skús si vyžiadať nový odkaz na obnovu hesla.")}
  finally{setBusy(false)}
 }
 return <main className="auth"><section className="card"><small>DUOAKVA DIARY</small><h1>Nové heslo</h1><p className="muted">Zadaj nové heslo pre svoj účet.</p><form className="form one" onSubmit={submit}><label>Nové heslo<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label>Potvrď nové heslo<input type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label><button className="primary" disabled={busy}>{busy?"Ukladám…":"Zmeniť heslo"}</button></form>{msg&&<div className="notice">{msg}</div>}<a className="link" href="/auth">Späť na prihlásenie</a></section></main>
}
