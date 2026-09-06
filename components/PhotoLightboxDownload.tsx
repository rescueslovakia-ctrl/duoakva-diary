"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {Download} from "lucide-react";

function extensionFromBlob(blob:Blob){
 const type=(blob.type||"").toLowerCase();
 if(type.includes("png"))return "png";
 if(type.includes("webp"))return "webp";
 if(type.includes("heic"))return "heic";
 if(type.includes("heif"))return "heif";
 return "jpg";
}

export default function PhotoLightboxDownload(){
 const[target,setTarget]=useState<HTMLElement|null>(null);
 const[busy,setBusy]=useState(false);

 useEffect(()=>{
  const find=()=>setTarget(document.querySelector<HTMLElement>(".photo-lightbox"));
  find();
  const observer=new MutationObserver(find);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);

 async function downloadPhoto(){
  if(!target||busy)return;
  const img=target.querySelector<HTMLImageElement>(".photo-lightbox-inner img");
  if(!img?.src)return;
  setBusy(true);
  try{
   const response=await fetch(img.src);
   if(!response.ok)throw new Error("download_failed");
   const blob=await response.blob();
   const objectUrl=URL.createObjectURL(blob);
   const a=document.createElement("a");
   a.href=objectUrl;
   a.download=`duoakva-fotografia-${new Date().toISOString().slice(0,10)}.${extensionFromBlob(blob)}`;
   document.body.appendChild(a);
   a.click();
   a.remove();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  }catch{
   window.open(img.src,"_blank","noopener,noreferrer");
  }finally{
   setBusy(false);
  }
 }

 if(!target)return null;
 return createPortal(
  <button
   type="button"
   onClick={downloadPhoto}
   disabled={busy}
   aria-label="Stiahnuť fotografiu"
   title="Stiahnuť fotografiu"
   style={{
    position:"absolute",
    top:18,
    right:64,
    zIndex:4,
    width:44,
    height:44,
    borderRadius:"999px",
    border:"1px solid rgba(255,255,255,.28)",
    background:"rgba(10,24,22,.72)",
    color:"#fff",
    display:"grid",
    placeItems:"center",
    cursor:busy?"wait":"pointer",
    backdropFilter:"blur(8px)",
    WebkitBackdropFilter:"blur(8px)",
    boxShadow:"0 6px 22px rgba(0,0,0,.25)"
   }}
  >
   <Download size={21}/>
  </button>,
  target
 );
}
