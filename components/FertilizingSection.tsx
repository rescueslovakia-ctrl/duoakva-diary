"use client";
import {useState} from "react";
import {Droplets,CalendarDays} from "lucide-react";
import type {Aquarium} from "@/components/AquariumsModule";
import FertilizersModule from "@/components/FertilizersModule";
import RegularFertilizerSchedule from "@/components/RegularFertilizerSchedule";
import WaterTreatmentModule from "@/components/WaterTreatmentModule";
import FertilizerMeasurementGuard from "@/components/FertilizerMeasurementGuard";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";
import CatalogCorrectionPanel from "@/components/CatalogCorrectionPanel";
export default function FertilizingSection({aquariums}:{aquariums:Aquarium[]}){const[tab,setTab]=useState<'fertilizers'|'schedule'>('fertilizers');return <><section className="card"><div className="section-head"><div><small>HNOJENIE AKVÁRIA</small><h3>Vyber časť</h3></div></div><div className="form-actions" style={{gap:10,flexWrap:'wrap'}}><button type="button" className={tab==='fertilizers'?'primary':''} onClick={()=>setTab('fertilizers')}><Droplets size={16}/> Hnojivá a korekcie</button><button type="button" className={tab==='schedule'?'primary':''} onClick={()=>setTab('schedule')}><CalendarDays size={16}/> Pravidelný režim</button></div><p className="muted" style={{marginBottom:0,marginTop:10}}>Korekcie sa riadia posledným meraním; pravidelný režim slúži na dlhodobé bežné dávkovanie.</p></section>{tab==='fertilizers'?<><MeasurementFreshnessNotice aquariums={aquariums}/><FertilizerMeasurementGuard aquariums={aquariums}/><FertilizersModule aquariums={aquariums}/><WaterTreatmentModule aquariums={aquariums}/><CatalogCorrectionPanel entityType="fertilizer"/></>:<RegularFertilizerSchedule aquariums={aquariums}/>}</>}
