"use client";
import {useState} from "react";
import {Droplets,CalendarDays,Waves} from "lucide-react";
import type {Aquarium} from "@/components/AquariumsModule";
import FertilizersModule from "@/components/FertilizersModule";
import RegularFertilizerSchedule from "@/components/RegularFertilizerSchedule";
import WaterTreatmentModule from "@/components/WaterTreatmentModule";
import FertilizerMeasurementGuard from "@/components/FertilizerMeasurementGuard";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";
import FertilizerUserDataPanel from "@/components/FertilizerUserDataPanel";
export default function FertilizingSection({aquariums}:{aquariums:Aquarium[]}){const[tab,setTab]=useState<'fertilizers'|'schedule'|'water'>('fertilizers');return <><section className="card"><div className="section-head"><div><small>HNOJENIE AKVÁRIA</small><h3>Vyber časť</h3></div></div><div className="form-actions" style={{gap:10,flexWrap:'wrap'}}><button type="button" className={tab==='fertilizers'?'primary':''} onClick={()=>setTab('fertilizers')}><Droplets size={16}/> Hnojivá a korekcie</button><button type="button" className={tab==='schedule'?'primary':''} onClick={()=>setTab('schedule')}><CalendarDays size={16}/> Pravidelný režim</button><button type="button" className={tab==='water'?'primary':''} onClick={()=>setTab('water')}><Waves size={16}/> Úprava vody / mineralizácia</button></div><p className="muted" style={{marginBottom:0,marginTop:10}}>Korekcie podľa merania, pravidelný režim a mineralizácia sú oddelené. Neoverené hnojivo sa nepoužije na výpočet, kým používateľ nepotvrdí údaje z etikety.</p></section>{tab==='fertilizers'?<><MeasurementFreshnessNotice aquariums={aquariums}/><FertilizerMeasurementGuard aquariums={aquariums}/><FertilizerUserDataPanel aquariums={aquariums}/><FertilizersModule aquariums={aquariums}/></>:tab==='schedule'?<RegularFertilizerSchedule aquariums={aquariums}/>:<WaterTreatmentModule aquariums={aquariums}/>}</>}
