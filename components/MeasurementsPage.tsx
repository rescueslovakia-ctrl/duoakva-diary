"use client";
import {useEffect,useMemo,useState} from "react";
import {Fish} from "lucide-react";
import {CartesianGrid,Legend,Line,LineChart,ReferenceArea,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {createClient} from "@/lib/supabase/client";
import {buildEffectiveTargets} from "@/lib/parameterTargets";
import type {TargetRange} from "@/lib/measurementStatus";
import type {Aquarium} from "@/components/AquariumsModule";
import MeasurementsModule from "@/components/MeasurementsModule";
import PhControllerMeasurementStatus from "@/components/PhControllerMeasurementStatus";
import MeasurementBiologyStatus from "@/components/MeasurementBiologyStatus";

const fields=[["ph","pH",""],["gh","GH","°dGH"],["kh","KH","°dKH"],["no2","NO₂","mg/l"],["no3","NO₃","mg/l"],["nh3","NH₃","mg/l"],["nh4","NH₄","mg/l"],["po4","PO₄","mg/l"],["fe","Fe","mg/l"],["k","K","mg/l"],["mg","Mg","mg/l"],["ca","Ca","mg/l"],["tds","TDS","ppm"],["ec","Vodivosť","µS/cm"],["temperature","Teplota","°C"],["o2","O₂","mg/l"]] as const;
const colors=["#0f766e","#2563eb","#dc2626","#9333ea","#d97706","#0891b2","#65a30d","#db2777","#4f46e5","#059669","#ea580c","#7c3aed","#0284c7","#be123c","#16a34a","#475569"];
type Point={measured_at:string;timestamp:number;[key:string]:any};
type Period="7"|"30"|"90"|"all";
type LivestockEvent={id:string;added_date:string;timestamp:number;quantity:number;name:string;category:string};

function fieldInfo(code:string){const f=fields.find(([c])=>c===code);return f?{label:f[1],unit:f[2]}:{label:code.toUpperCase(),unit:""}}
function fmt(value:number){if(!Number.isFinite(value))return"–";if(Math.abs(value)>=100)return value.toFixed(0);if(Math.abs(value)>=10)return value.toFixed(1).replace(/\.0$/,"");return value.toFixed(2).replace(/0+$/,"").replace(/\.$/,"")}
function eventName(row:any){const catalog=Array.isArray(row?.livestock_catalog)?row.livestock_catalog[0]:row?.livestock_catalog;return row?.custom_name||catalog?.common_name||catalog?.scientific_name||"Živočích"}
function eventDateTs(date:string){return new Date(`${date}T12:00:00`).getTime()}
function interpolateAt(points:Point[],code:string,timestamp:number){const valid=points.map(p=>({x:Number(p.timestamp),y:Number(p[code])})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).sort((a,b)=>a.x-b.x);if(!valid.length)return null;const exact=valid.find(p=>p.x===timestamp);if(exact)return exact.y;let before:{x:number;y:number}|undefined,after:{x:number;y:number}|undefined;for(const p of valid){if(p.x<timestamp)before=p;else if(p.x>timestamp){after=p;break}}if(!before||!after||after.x===before.x)return null;return before.y+(after.y-before.y)*((timestamp-before.x)/(after.x-before.x))}

function TrendTooltip({active,payload,label,selected,multi}:{active?:boolean;payload?:any[];label?:number|string;selected:string[];multi:boolean}){
 if(!active||!payload?.length)return null;
 const row=payload[0]?.payload||{};
 if(row.__event){const e=row.__event as LivestockEvent;return <div style={{background:"white",border:"1px solid #f4c17a",borderRadius:12,padding:"10px 12px",boxShadow:"0 8px 24px rgba(15,23,42,.12)",minWidth:210}}><div style={{display:"flex",alignItems:"center",gap:7,color:"#b45309",fontWeight:800}}><span style={{width:10,height:10,borderRadius:999,background:"#f59e0b"}}/> Udalosť osádky</div><b style={{display:"block",marginTop:7}}>{new Date(`${e.added_date}T12:00:00`).toLocaleDateString("sk-SK")}</b><div style={{marginTop:5}}>{e.quantity}× {e.name}</div><small style={{display:"block",marginTop:7,color:"#64748b"}}>Časová súvislosť s vývojom parametra, nie automaticky potvrdená príčina zmeny.</small></div>}
 return <div style={{background:"white",border:"1px solid #dbe5e7",borderRadius:12,padding:"10px 12px",boxShadow:"0 8px 24px rgba(15,23,42,.12)"}}><b>{label!=null?new Date(Number(label)).toLocaleString("sk-SK"):""}</b><div style={{display:"grid",gap:5,marginTop:7}}>{selected.map((code,i)=>{const info=fieldInfo(code),raw=Number(row[`${code}__raw`]??row[code]);if(!Number.isFinite(raw))return null;return <div key={code} style={{display:"flex",gap:8,alignItems:"center"}}><span style={{width:9,height:9,borderRadius:999,background:colors[i%colors.length]}}/><span><b>{info.label}</b> {fmt(raw)} {info.unit}</span>{multi&&<small>trend {fmt(Number(row[code]))}%</small>}</div>})}</div></div>
}

function EventDot(props:any){const{cx,cy,payload}=props;if(!payload?.__event||!Number.isFinite(cx)||!Number.isFinite(cy))return null;return <g><circle cx={cx} cy={cy} r={9} fill="rgba(245,158,11,.18)"/><circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={2}/></g>}

function TrendSummary({points,selected,period}:{points:Point[];selected:string[];period:Period}){if(!selected.length)return null;const summaries=selected.map(code=>{const vals=points.filter(p=>!p.__event).map(p=>Number(p[`${code}__raw`]??p[code])).filter(Number.isFinite);if(vals.length<2)return null;const first=vals[0],last=vals[vals.length-1],delta=last-first,info=fieldInfo(code),threshold=Math.max(Math.abs(first)*.05,.01),movement=Math.abs(delta)<=threshold?"je stabilné":delta>0?"stúplo":"kleslo",window=period==="all"?"v zobrazenom období":`za posledných ${period} dní`;return movement==="je stabilné"?`${info.label} ${window} zostáva približne stabilné (${fmt(last)} ${info.unit}).`:`${info.label} ${window} ${movement} z ${fmt(first)} na ${fmt(last)} ${info.unit}.`}).filter(Boolean) as string[];return summaries.length?<div className="notice"><b>Vývoj parametrov</b><div style={{display:"grid",gap:5,marginTop:7}}>{summaries.map(x=><div key={x}>{x}</div>)}</div></div>:<div className="notice">Na vyhodnotenie trendu sú potrebné aspoň dve merania vybraného parametra.</div>}

function MeasurementTrendChart({aquariums}:{aquariums:Aquarium[]}){
 const[aquariumId,setAquariumId]=useState(aquariums[0]?.id||"");
 const[selected,setSelected]=useState<string[]>(["no2"]);
 const[period,setPeriod]=useState<Period>("30");
 const[rows,setRows]=useState<Point[]>([]);
 const[targets,setTargets]=useState<Record<string,TargetRange>>({});
 const[livestockEvents,setLivestockEvents]=useState<LivestockEvent[]>([]);
 const[showLivestockEvents,setShowLivestockEvents]=useState(false);
 const[loading,setLoading]=useState(false);
 const[msg,setMsg]=useState("");
 useEffect(()=>{if(!aquariumId&&aquariums[0])setAquariumId(aquariums[0].id)},[aquariums,aquariumId]);
 useEffect(()=>{if(aquariumId)void load()},[aquariumId]);
 async function load(){
  setLoading(true);setMsg("");
  const s=createClient(),[m,t,u,e,l,events]=await Promise.all([
   s.from("measurement_sessions").select("id,measured_at,context_reset_maintenance_id,measurement_values(parameter_code,value)").eq("aquarium_id",aquariumId).order("measured_at",{ascending:true}).limit(500),
   s.from("aquarium_parameter_targets").select("parameter_code,min_value,target_value,max_value,source_type").eq("aquarium_id",aquariumId),
   s.from('aquarium_user_parameter_targets').select('parameter_code,min_value,max_value').eq('aquarium_id',aquariumId),
   s.from('aquarium_equipment').select('category,manufacturer,model,notes,settings').eq('aquarium_id',aquariumId).eq('active',true),
   s.from('aquarium_livestock').select('discovery_data,livestock_catalog(ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperature_min,temperature_max)').eq('aquarium_id',aquariumId).eq('active',true),
   s.from('aquarium_livestock').select('id,custom_name,category,quantity,added_date,livestock_catalog(common_name,scientific_name)').eq('aquarium_id',aquariumId).eq('active',true).not('added_date','is',null).order('added_date',{ascending:true})
  ]);
  setLoading(false);
  if(m.error){setMsg("Graf sa nepodarilo načítať.");return}
  setRows((m.data||[]).filter((x:any)=>!x.context_reset_maintenance_id).map((x:any)=>{const p:Point={measured_at:x.measured_at,timestamp:new Date(x.measured_at).getTime()};for(const v of x.measurement_values||[])p[v.parameter_code]=Number(v.value);return p}));
  setTargets(buildEffectiveTargets({systemRows:(t.data||[]).filter((x:any)=>x.source_type!=='user_custom'),userRows:u.data||[],equipmentRows:e.data||[],livestockRows:l.data||[]}));
  if(!events.error)setLivestockEvents((events.data||[]).filter((x:any)=>x.added_date).map((x:any)=>({id:x.id,added_date:x.added_date,timestamp:eventDateTs(x.added_date),quantity:Number(x.quantity)||1,name:eventName(x),category:x.category||'other'})));
 }
 const filtered=useMemo(()=>period==="all"?rows:rows.filter(p=>p.timestamp>=Date.now()-Number(period)*86400000),[rows,period]);
 const multi=selected.length>1;
 const chartData=useMemo(()=>{const ranges:Record<string,{min:number;max:number}>={};if(multi)for(const code of selected){const vals=filtered.map(p=>Number(p[code])).filter(Number.isFinite);if(vals.length)ranges[code]={min:Math.min(...vals),max:Math.max(...vals)}}return filtered.map(p=>{const out:Point={...p};for(const code of selected){const raw=Number(p[code]);out[`${code}__raw`]=Number.isFinite(raw)?raw:null;if(multi&&Number.isFinite(raw)){const r=ranges[code];out[code]=r?(r.max===r.min?50:((raw-r.min)/(r.max-r.min))*100):null}}return out})},[filtered,selected,multi]);
 const visibleSelected=selected.filter(code=>chartData.some(p=>Number.isFinite(Number(p[`${code}__raw`]??p[code]))));
 const one=selected.length===1?selected[0]:null,target=one?targets[one]:undefined,oneInfo=one?fieldInfo(one):null;
 const chartMin=chartData.length?Math.min(...chartData.map(p=>p.timestamp)):null,chartMax=chartData.length?Math.max(...chartData.map(p=>p.timestamp)):null;
 const visibleEvents=useMemo(()=>showLivestockEvents&&chartMin!=null&&chartMax!=null?livestockEvents.filter(e=>e.timestamp>=chartMin&&e.timestamp<=chartMax):[],[showLivestockEvents,livestockEvents,chartMin,chartMax]);
 const displayData=useMemo(()=>{if(!showLivestockEvents||!visibleEvents.length||!visibleSelected.length)return chartData;const anchor=visibleSelected[0];const eventRows=visibleEvents.map(e=>{const y=interpolateAt(chartData,anchor,e.timestamp);if(y==null)return null;return{measured_at:new Date(e.timestamp).toISOString(),timestamp:e.timestamp,__event:e,__eventY:y} as Point}).filter(Boolean) as Point[];return[...chartData,...eventRows].sort((a,b)=>a.timestamp-b.timestamp)},[chartData,visibleEvents,visibleSelected,showLivestockEvents]);
 function toggle(code:string){setSelected(prev=>prev.includes(code)?(prev.length===1?prev:prev.filter(x=>x!==code)):[...prev,code])}
 return <>
  <section className="card">
   <h3>Graf vývoja</h3>
   <div className="form"><label>Akvárium<select value={aquariumId} onChange={e=>setAquariumId(e.target.value)}>{aquariums.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Obdobie<select value={period} onChange={e=>setPeriod(e.target.value as Period)}><option value="7">7 dní</option><option value="30">30 dní</option><option value="90">90 dní</option><option value="all">Všetko</option></select></label></div>
   <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"14px 0"}}>{fields.map(([code,label])=><button type="button" key={code} onClick={()=>toggle(code)} className={selected.includes(code)?"primary":""}>{label}</button>)}</div>
   <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",margin:"2px 0 14px"}}><button type="button" className={showLivestockEvents?"primary":""} onClick={()=>setShowLivestockEvents(v=>!v)}><Fish size={15}/> Udalosti osádky</button><span className="muted">Udalosť sa zobrazí ako oranžový bod priamo na krivke. Podrobnosti uvidíš po prejdení myšou alebo ťuknutí.</span></div>
   {showLivestockEvents&&chartData.length>0&&visibleEvents.length===0&&<div className="notice" style={{marginBottom:14}}>V zobrazenom období nie je evidované pridanie osádky.</div>}
   {one&&target&&<div className="notice">Aktívny rozsah: <b>{target.min??'–'} až {target.max??'–'}</b>{target.source==='user_custom'?' · nastavený používateľom':target.source==='ph_controller'?' · podľa pH controllera':target.source==='livestock'?' · podľa osádky':''}</div>}
   {msg&&<div className="notice">{msg}</div>}
   {loading?<div className="notice">Načítavam graf…</div>:visibleSelected.length?<div style={{width:"100%",height:390}}><ResponsiveContainer><LineChart data={displayData}><CartesianGrid strokeDasharray="3 5" vertical={false}/><XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin","dataMax"]} tickFormatter={v=>new Date(Number(v)).toLocaleDateString("sk-SK",{day:"2-digit",month:"2-digit"})}/><YAxis domain={multi?[0,100]:["auto","auto"]} tickFormatter={v=>multi?`${Math.round(v)}%`:fmt(Number(v))} label={oneInfo?.unit?{value:oneInfo.unit,angle:-90,position:"insideLeft"}:undefined}/><Tooltip content={<TrendTooltip selected={selected} multi={multi}/>}/><Legend formatter={value=>value==="__eventY"?"Udalosť osádky":fieldInfo(String(value)).label}/>{!multi&&target?.min!==undefined&&target?.max!==undefined&&<ReferenceArea y1={target.min} y2={target.max} fill="#22c55e" fillOpacity={.08}/>} {selected.map((code,i)=><Line key={code} type="monotone" dataKey={code} connectNulls stroke={colors[i%colors.length]} strokeWidth={3} dot={{r:3}} name={code}/>)}{showLivestockEvents&&<Line type="linear" dataKey="__eventY" stroke="transparent" strokeWidth={0} dot={<EventDot/>} activeDot={<EventDot/>} connectNulls={false} name="__eventY" legendType="circle"/>}</LineChart></ResponsiveContainer></div>:<div className="notice">Pre zvolené obdobie nie sú dostupné hodnoty vybraných parametrov.</div>}
  </section>
  <TrendSummary points={chartData} selected={visibleSelected} period={period}/>
 </>
}

type MeasurementTab="new"|"history"|"biology"|"trend";
export default function MeasurementsPage({aquariums}:{aquariums:Aquarium[]}){const[tab,setTab]=useState<MeasurementTab>("new");if(!aquariums.length)return <section className="card"><h3>Merania</h3><p>Najprv vytvor akvárium.</p></section>;return <div className="measurements-v1"><div className="measurements-v1-tabs">{[["new","Nové meranie"],["history","História meraní"],["biology","Biologické vyhodnotenie"],["trend","Graf vývoja"]].map(([key,label])=><button key={key} type="button" className={tab===key?"active":""} onClick={()=>setTab(key as MeasurementTab)}>{label}</button>)}</div><div className={`measurements-v1-content measurements-${tab}`}>{tab==="new"?<><PhControllerMeasurementStatus aquariums={aquariums}/><MeasurementsModule aquariums={aquariums} view="new"/></>:tab==="history"?<MeasurementsModule aquariums={aquariums} view="history"/>:tab==="biology"?<MeasurementBiologyStatus aquariums={aquariums}/>:<MeasurementTrendChart aquariums={aquariums}/>}</div></div>}
