"use client";
import {useEffect} from "react";

type Prefs={confirmDeletes?:boolean;compactCards?:boolean};
const KEY="duoakva-user-settings-v1";
function read():Prefs{try{return JSON.parse(localStorage.getItem(KEY)||"{}") as Prefs}catch{return {}}}

export default function UserPreferencesRuntime(){
 useEffect(()=>{
  const nativeConfirm=window.confirm.bind(window);
  let prefs:Prefs=read();
  const apply=()=>{prefs=read();document.documentElement.classList.toggle("duoakva-compact",prefs.compactCards===true)};
  const wrapped=(message?:string)=>prefs.confirmDeletes===false?true:nativeConfirm(message);
  window.confirm=wrapped;
  apply();
  const timer=window.setInterval(apply,500);
  const storage=()=>apply();window.addEventListener("storage",storage);
  return()=>{window.clearInterval(timer);window.removeEventListener("storage",storage);window.confirm=nativeConfirm;document.documentElement.classList.remove("duoakva-compact")};
 },[]);
 return null;
}
