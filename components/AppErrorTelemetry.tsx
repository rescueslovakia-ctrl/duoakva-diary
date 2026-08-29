"use client";
import {useEffect,useState} from "react";
import {reportAppError,readableError} from "@/lib/errorReporting";

function safeUrl(input:RequestInfo|URL){
 try{const raw=typeof input==='string'?input:input instanceof URL?input.toString():input.url;const u=new URL(raw,window.location.origin);return `${u.origin}${u.pathname}`}catch{return 'unknown'}
}
export default function AppErrorTelemetry(){
 const[msg,setMsg]=useState('');
 useEffect(()=>{
  const onReported=(e:Event)=>{const ref=(e as CustomEvent).detail?.ref as string|undefined;setMsg(ref?`Nastala technická chyba. Bola zaznamenaná pre administrátora. Referencia: ${ref.slice(0,8).toUpperCase()}`:'Nastala technická chyba. Skús akciu zopakovať.');setTimeout(()=>setMsg(''),7000)};
  const onError=(e:ErrorEvent)=>{void reportAppError({severity:'fatal',source:'client',module:'window',message:e.message||'Neočakávaná chyba aplikácie',errorCode:'WINDOW_ERROR',context:{filename:e.filename||'',line:e.lineno,column:e.colno},notifyUser:true})};
  const onRejection=(e:PromiseRejectionEvent)=>{void reportAppError({severity:'error',source:'client',module:'promise',message:readableError(e.reason),errorCode:'UNHANDLED_REJECTION',notifyUser:true})};
  window.addEventListener('duoakva:error-reported',onReported as EventListener);
  window.addEventListener('error',onError);
  window.addEventListener('unhandledrejection',onRejection);
  const original=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
   try{
    const response=await original(input,init);
    const url=safeUrl(input);
    const shouldLog=response.status>=500||(response.status>=400&&url.includes('/api/'));
    const isReporter=url.includes('/rest/v1/rpc/record_application_error');
    if(shouldLog&&!isReporter)void reportAppError({severity:response.status>=500?'error':'warning',source:'api',module:'http',message:`HTTP ${response.status} pri požiadavke ${url}`,errorCode:`HTTP_${response.status}`,context:{url,method:init?.method||'GET'},notifyUser:response.status>=500});
    return response;
   }catch(error){
    const url=safeUrl(input),isReporter=url.includes('/rest/v1/rpc/record_application_error');
    if(!isReporter)void reportAppError({severity:'error',source:'api',module:'network',message:readableError(error),errorCode:'FETCH_FAILED',context:{url,method:init?.method||'GET'},notifyUser:true});
    throw error;
   }
  };
  return()=>{window.fetch=original;window.removeEventListener('duoakva:error-reported',onReported as EventListener);window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection)};
 },[]);
 return msg?<div role="alert" style={{position:'fixed',right:18,bottom:18,zIndex:9999,maxWidth:420,padding:'12px 14px',borderRadius:12,background:'#fff7ed',border:'1px solid #fdba74',boxShadow:'0 10px 30px rgba(15,23,42,.18)',fontWeight:650}}>{msg}</div>:null;
}
