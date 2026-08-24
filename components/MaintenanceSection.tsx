"use client";
import {useState} from "react";
import {NotebookPen,Droplets} from "lucide-react";
import type {Aquarium} from "@/components/AquariumsModule";
import MaintenanceModule from "@/components/MaintenanceModule";
import FertilizerDoseMaintenance from "@/components/FertilizerDoseMaintenance";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";

export default function MaintenanceSection({aquariums}:{aquariums:Aquarium[]}){
 const[tab,setTab]=useState<'maintenance'|'dosing'>('maintenance');
 return <><section className="card"><div className="section-head"><div><small>ÚDRŽBA AKVÁRIA</small><h3>Vyber evidenciu</h3></div></div><div className="form-actions" style={{gap:10,flexWrap:'wrap'}}><button type="button" className={tab==='maintenance'?'primary':''} onClick={()=>setTab('maintenance')}><NotebookPen size={16}/> História údržby</button><button type="button" className={tab==='dosing'?'primary':''} onClick={()=>setTab('dosing')}><Droplets size={16}/> Evidencia dávok hnojív</button></div><p className="muted" style={{marginBottom:0,marginTop:10}}>Dávkovanie je samostatná evidencia, ale zapísaná dávka sa zároveň zobrazí aj v spoločnej histórii údržby.</p></section>{tab==='maintenance'?<><MeasurementFreshnessNotice aquariums={aquariums}/><MaintenanceModule aquariums={aquariums}/></>:<FertilizerDoseMaintenance aquariums={aquariums}/>}</>;
}
