"use client";
import {useState} from "react";
import {NotebookPen,Droplets} from "lucide-react";
import type {Aquarium} from "@/components/AquariumsModule";
import MaintenanceModule from "@/components/MaintenanceModule";
import FertilizerDoseMaintenance from "@/components/FertilizerDoseMaintenance";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";

export default function MaintenanceSection({aquariums}:{aquariums:Aquarium[]}){
 const[tab,setTab]=useState<'maintenance'|'dosing'>('maintenance');
 return <><div className="mode-tabs" style={{marginBottom:16}}><button className={tab==='maintenance'?'selected':''} onClick={()=>setTab('maintenance')}><NotebookPen size={16}/> Údržba</button><button className={tab==='dosing'?'selected':''} onClick={()=>setTab('dosing')}><Droplets size={16}/> Dávkovanie hnojív</button></div>{tab==='maintenance'?<><MeasurementFreshnessNotice aquariums={aquariums}/><MaintenanceModule aquariums={aquariums}/></>:<FertilizerDoseMaintenance aquariums={aquariums}/>}</>;
}
