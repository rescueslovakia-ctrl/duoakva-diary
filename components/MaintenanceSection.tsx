"use client";
import {useState} from "react";
import {NotebookPen,Droplets,CalendarDays} from "lucide-react";
import type {Aquarium} from "@/components/AquariumsModule";
import MaintenanceModule from "@/components/MaintenanceModule";
import MaintenancePreferencesBridge from "@/components/MaintenancePreferencesBridge";
import SafeFertilizerDoseMaintenance from "@/components/SafeFertilizerDoseMaintenance";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";
import FertilizingSection from "@/components/FertilizingSection";
type Tab='maintenance'|'dosing'|'fertilizing';
export default function MaintenanceSection({aquariums}:{aquariums:Aquarium[]}){const[tab,setTab]=useState<Tab>('maintenance');return <div className="maintenance-v1"><MaintenancePreferencesBridge/><div className="maintenance-v1-intro"><div><small>STAROSTLIVOSŤ O AKVÁRIUM</small><h3>Údržba a hnojenie</h3><p>Bežné zásahy, evidencia dávok aj odporúčané hnojenie sú na jednom mieste. Zoznam používaných hnojív zostáva v Akvárium → Hnojivá.</p></div></div><div className="maintenance-v1-tabs"><button type="button" className={tab==='maintenance'?'active':''} onClick={()=>setTab('maintenance')}><NotebookPen size={16}/> Údržba</button><button type="button" className={tab==='dosing'?'active':''} onClick={()=>setTab('dosing')}><Droplets size={16}/> Evidencia dávok</button><button type="button" className={tab==='fertilizing'?'active':''} onClick={()=>setTab('fertilizing')}><CalendarDays size={16}/> Hnojenie a úprava vody</button></div><div className={`maintenance-v1-content maintenance-${tab}`}>{tab==='maintenance'?<><MeasurementFreshnessNotice aquariums={aquariums}/><MaintenanceModule aquariums={aquariums}/></>:tab==='dosing'?<SafeFertilizerDoseMaintenance aquariums={aquariums}/>:<FertilizingSection aquariums={aquariums}/>}</div></div>}
