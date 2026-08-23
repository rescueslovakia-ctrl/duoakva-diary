"use client";
import {useState} from "react";
import {createClient,isSupabaseConfigured} from "@/lib/supabase/client";

const AUTH_TIMEOUT_MS=12000;

export default function AuthPage(){
 const[email,setEmail]=useState("");
 const[password,setPassword]=useState("");
 const[confirmPassword,setConfirmPassword]=useState("");
 const[mode,setMode]=useState<"login"|"signup">("login");
 const[msg,setMsg]=useState("");
 const[busy,setBusy]=useState(false);

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  setMsg("");
  if(!isSupabaseConfigured()){setMsg("Služba prihlásenia momentálne nie je dostupná.");return}
  if(mode==="signup"&&password!==confirmPassword){setMsg("Heslá sa nezhodujú.");return}
  if(password.length<8){setMsg("Heslo musí mať aspoň 8 znakov.");return}
  setBusy(true);
  try{
   const s=createClient();
   const authPromise=mode==="signup"?s.auth.signUp({email:email.trim(),password}):s.auth.signInWithPassword({email:email.trim(),password});
   const timeoutPromise=new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("Spojenie s prihlasovacou službou trvá príliš dlho. Skús to prosím znova o chvíľu.")),AUTH_TIMEOUT_MS));
   const r=await Promise.race([authPromise,timeoutPromise]);
   if(r.error){setMsg(r.error.message);return}
   if(mode==="login"){
    const{data,error}=await s.auth.getSession();
    if(error){setMsg(error.message);return}
    if(!data.session){setMsg("Prihlásenie sa nepodarilo dokončiť. Skús to prosím znova.");return}
    window.location.assign("/");
   }else{
    if(r.data.session)window.location.assign("/");
    else setMsg("Účet bol vytvorený. Skontroluj e-mail a potvrď registráciu, potom sa môžeš prihlásiť.");
   }
  }catch(error){
   setMsg(error instanceof Error?error.message:"Pri prihlasovaní nastala neznáma chyba.");
  }finally{setBusy(false)}
 }

 async function resetPassword(){
  setMsg("");
  if(!email.trim()){setMsg("Najprv zadaj e-mail, na ktorý chceš poslať odkaz na obnovu hesla.");return}
  if(!isSupabaseConfigured()){setMsg("Služba prihlásenia momentálne nie je dostupná.");return}
  setBusy(true);
  try{
   const s=createClient();
   const{error}=await s.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/auth/reset`});
   setMsg(error?error.message:"Ak je tento e-mail registrovaný, poslali sme naň odkaz na obnovu hesla.");
  }catch{setMsg("Odkaz na obnovu hesla sa nepodarilo odoslať. Skús to znova o chvíľu.")}
  finally{setBusy(false)}
 }

 function switchMode(){setMode(mode==="login"?"signup":"login");setMsg("");setPassword("");setConfirmPassword("")}

 return <main className="auth"><section className="card"><small>DUOAKVA DIARY</small><h1>{mode==="login"?"Prihlásenie":"Registrácia"}</h1><p className="muted">{mode==="login"?"Prihlás sa do svojho akvaristického denníka.":"Vytvor si účet a začni spravovať svoje akváriá na jednom mieste."}</p><form onSubmit={submit} className="form one"><label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label><label>Heslo<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>{mode==="signup"&&<label>Potvrď heslo<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} disabled={busy}/></label>}<button className="primary" disabled={busy}>{busy?(mode==="login"?"Prihlasujem…":"Vytváram účet…"):(mode==="login"?"Prihlásiť":"Vytvoriť účet")}</button></form>{msg&&<div className="notice">{msg}</div>}<div className="form-actions">{mode==="login"&&<button type="button" disabled={busy} onClick={resetPassword}>Zabudol som heslo</button>}<button type="button" disabled={busy} onClick={switchMode}>{mode==="login"?"Nemáš účet? Registrácia":"Už máš účet? Prihlásenie"}</button></div></section></main>
}
