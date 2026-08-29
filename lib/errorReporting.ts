import {createClient} from "@/lib/supabase/client";

type ReportInput={
 severity?:'warning'|'error'|'fatal';
 source?:'client'|'api'|'database'|'server';
 module?:string;
 message:string;
 errorCode?:string|null;
 aquariumId?:string|null;
 context?:Record<string,unknown>;
 fingerprint?:string;
 notifyUser?:boolean;
};

const recent=new Map<string,number>();
function safeContext(input?:Record<string,unknown>){
 const out:Record<string,unknown>={};
 for(const [k,v] of Object.entries(input||{})){
  if(/token|password|secret|authorization|cookie|email/i.test(k))continue;
  if(typeof v==='string')out[k]=v.slice(0,500);
  else if(typeof v==='number'||typeof v==='boolean'||v==null)out[k]=v;
 }
 return out;
}
export async function reportAppError(input:ReportInput):Promise<string|null>{
 try{
  const fingerprint=input.fingerprint||`${input.source||'client'}|${input.module||'unknown'}|${input.errorCode||''}|${input.message.slice(0,300)}`;
  const now=Date.now(),last=recent.get(fingerprint)||0;
  if(now-last<30000)return null;
  recent.set(fingerprint,now);
  const s=createClient();
  const{data,error}=await s.rpc('record_application_error',{
   p_severity:input.severity||'error',p_source:input.source||'client',p_module:input.module||'unknown',p_message:input.message.slice(0,2000),p_error_code:input.errorCode||null,p_fingerprint:fingerprint,p_context:safeContext(input.context),p_aquarium_id:input.aquariumId||null
  });
  if(error)return null;
  const ref=typeof data==='string'?data:null;
  if(input.notifyUser&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('duoakva:error-reported',{detail:{ref}}));
  return ref;
 }catch{return null}
}

export function readableError(error:unknown){
 if(error instanceof Error)return error.message;
 if(typeof error==='string')return error;
 try{return JSON.stringify(error)}catch{return 'Neznáma chyba'}
}
