"use client";
import {useState} from "react";
import {Droplets,CalendarDays,Waves,ShieldCheck} from "lucide-react";
import type {Aquarium} from "@/components/AquariumsModule";
import FertilizersModule from "@/components/FertilizersModule";
import RegularFertilizerSchedule from "@/components/RegularFertilizerSchedule";
import WaterTreatmentModule from "@/components/WaterTreatmentModule";
import FertilizerMeasurementGuard from "@/components/FertilizerMeasurementGuard";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";
type Tab='correction'|'schedule'|'water';
export default function FertilizingSection({aquariums}:{aquariums:Aquarium[]}){const[tab,setTab]=useState<Tab>('correction');return <div className="fertilizing-v1"><div className="fertilizing-v1-intro"><div><small>HNOJENIE AKVÁRIA</small><h3>Hnojenie a úprava vody</h3><p>Korekčné dávkovanie podľa aktuálnych meraní, pravidelný režim a mineralizácia vody sú oddelené. Správa konkrétnych hnojív zostáva v Akvárium → Hnojivá.</p></div><ShieldCheck size={24}/></div><div className="fertilizing-v1-tabs"><button type="button" className={tab==='correction'?'active':''} onClick={()=>setTab('correction')}><Droplets size={16}/> Korekcia podľa merania</button><button type="button" className={tab==='schedule'?'active':''} onClick={()=>setTab('schedule')}><CalendarDays size={16}/> Pravidelný režim</button><button type="button" className={tab==='water'?'active':''} onClick={()=>setTab('water')}><Waves size={16}/> Úprava vody / mineralizácia</button></div><div className={`fertilizing-v1-content fertilizing-${tab}`}>{tab==='correction'?<><MeasurementFreshnessNotice aquariums={aquariums}/><FertilizerMeasurementGuard aquariums={aquariums}/><FertilizersModule aquariums={aquariums}/></>:tab==='schedule'?<RegularFertilizerSchedule aquariums={aquariums}/>:<WaterTreatmentModule aquariums={aquariums}/>}</div></div>}
