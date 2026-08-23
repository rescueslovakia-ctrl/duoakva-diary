"use client";
import {useState} from "react";
import {Fish,Leaf,Wrench,ImageOff} from "lucide-react";

type Props={src?:string|null;alt:string;kind?:"plant"|"livestock"|"equipment";className?:string};
export default function EntityImage({src,alt,kind="livestock",className=""}:Props){
 const[failed,setFailed]=useState(false);
 if(!src||failed){const Icon=kind==="plant"?Leaf:kind==="equipment"?Wrench:Fish;return <div className={`entity-image entity-image-empty ${className}`} aria-label={`Bez fotografie: ${alt}`}><Icon size={26}/><ImageOff size={13}/></div>}
 return <div className={`entity-image ${className}`}><img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/></div>
}
