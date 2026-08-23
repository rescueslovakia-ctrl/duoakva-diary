"use client";
import {useState} from "react";
import {createClient,isSupabaseConfigured} from "@/lib/supabase/client";

const AUTH_TIMEOUT_MS=12000;

export default function AuthPage(){
 const[email,setEmail]=useState("");
 const[password,setPassword]=useState("");
 const[mode,setMode]=useState<"login"|"signup">("login");
 const[msg,setMsg]=useState("");
 const[busy,setBusy]=useState(false);

 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy)return;
  setMsg("");
  if(!isSupabaseConfigured()){setMsg("Supabase ešte nie je nakonfigurovaný.");return}
  setBusy(true);
  try{
   const s=createClient();
   const authPromise=mode==="signup"?s.auth.signUp({email,password}):s.auth.signInWithPassword({email,password});
   const timeoutPromise=new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("Prihlásenie neodpovedá. Skontrolujeme spojenie so Supabase.")),AUTH_TIMEOUT_MS));
   const r=await Promise.race([authPromise,timeoutPromise]);
   if(r.error){setMsg(r.error.message);return}
   if(mode==="login"){
    const{data,error}=await s.auth.getSession();
    if(error){setMsg(error.message);return}
    if(!data.session){setMsg("Prihlásenie prebehlo bez chyby, ale session sa nevytvorila.");return}
    window.location.assign("/");
   }else setMsg("Účet vytvorený. Skontroluj e-mail, ak je zapnuté potvrdenie.");
  }catch(error){
   setMsg(error instanceof Error?error.message:"Pri prihlasovaní nastala neznáma chyba.");
  }finally{
   setBusy(false);
  }
 }

 return <main className="auth"><section className="card"><small>DUOAKVA DIARY</small><h1>{mode==="login"?"Prihlásenie":"Registrácia"}</h1><form onSubmit={submit} className="form one"><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label><label>Heslo<input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><button className="primary" disabled={busy}>{busy?(mode==="login"?"Prihlasujem…":"Vytváram účet…"):(mode==="login"?"Prihlásiť":"Vytvoriť účet")}</button></form>{msg&&<div className="notice">{msg}</div>}<button disabled={busy} onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Nemáš účet? Registrácia":"Už máš účet? Prihlásenie"}</button></section></main>
}
