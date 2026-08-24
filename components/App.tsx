"use client";
import {useEffect,useState} from "react";
import {Home,Waves,FlaskConical,Wrench,Leaf,Fish,Droplets,NotebookPen,Bell,Settings,LogOut,Images} from "lucide-react";
import {createClient,isSupabaseConfigured} from "@/lib/supabase/client";
import AquariumsModule,{type Aquarium} from "@/components/AquariumsModule";
import MeasurementsModule from "@/components/MeasurementsModule";
import EquipmentModule from "@/components/EquipmentModule";
import PlantsModule from "@/components/PlantsModule";
import LivestockModule from "@/components/LivestockModule";
import FertilizersModule from "@/components/FertilizersModule";
import WaterTreatmentModule from "@/components/WaterTreatmentModule";
import MaintenanceModule from "@/components/MaintenanceModule";
import TasksModule from "@/components/TasksModule";
import SettingsModule from "@/components/SettingsModule";
import DashboardModule from "@/components/DashboardModule";
import PhotoDiaryModule from "@/components/PhotoDiaryModule";
import FeedbackBubble from "@/components/FeedbackBubble";
import MeasurementFreshnessNotice from "@/components/MeasurementFreshnessNotice";

const nav=[["Prehľad",Home],["Akváriá",Waves],["Fotodenník",Images],["Merania",FlaskConical],["Technika",Wrench],["Rastliny",Leaf],["Osádka",Fish],["Hnojenie",Droplets],["Údržba",NotebookPen],["Úlohy",Bell],["Nastavenia",Settings]] as const;

export default function App(){
 const[page,setPage]=useState("Prehľad");const[email,setEmail]=useState("");const[userId,setUserId]=useState("");const[aquariums,setAquariums]=useState<Aquarium[]>([]);const[msg,setMsg]=useState("");
 useEffect(()=>{(async()=>{if(!isSupabaseConfigured())return;const s=createClient();const{data}=await s.auth.getUser();const u=data.user;if(!u)return;setEmail(u.email||"");setUserId(u.id);const{data:aq,error}=await s.from("aquariums").select("id,name,net_volume_l,aquarium_type,water_type,water_source,substrate_name,target_temperature_c,height_cm,setup_date").order("created_at");if(error)setMsg(error.message);else setAquariums((aq||[]) as Aquarium[])})()},[]);
 async function logout(){await createClient().auth.signOut();location.href="/"}
 let body:React.ReactNode;
 if(page==="Prehľad")body=<DashboardModule aquariums={aquariums}/>;
 else if(page==="Akváriá")body=<AquariumsModule userId={userId} data={aquariums} setData={setAquariums}/>;
 else if(page==="Fotodenník")body=<PhotoDiaryModule aquariums={aquariums}/>;
 else if(page==="Merania")body=<MeasurementsModule aquariums={aquariums}/>;
 else if(page==="Technika")body=<EquipmentModule aquariums={aquariums}/>;
 else if(page==="Rastliny")body=<PlantsModule aquariums={aquariums}/>;
 else if(page==="Osádka")body=<LivestockModule aquariums={aquariums}/>;
 else if(page==="Hnojenie")body=<><MeasurementFreshnessNotice aquariums={aquariums}/><FertilizersModule aquariums={aquariums}/><WaterTreatmentModule aquariums={aquariums}/></>;
 else if(page==="Údržba")body=<><MeasurementFreshnessNotice aquariums={aquariums}/><MaintenanceModule aquariums={aquariums}/></>;
 else if(page==="Úlohy")body=<TasksModule aquariums={aquariums}/>;
 else if(page==="Nastavenia")body=<SettingsModule email={email}/>;
 else body=null;
 return <div className="app"><aside><div className="logo">DuoAkva <b>Diary</b></div>{nav.map(([n,I])=><button className={page===n?"on":""} key={n} onClick={()=>setPage(n)}><I size={18}/>{n}</button>)}{email&&<button onClick={logout}><LogOut size={18}/>Odhlásiť</button>}</aside><main><header><div><small>DUOAKVA DIARY</small><h1>{page}</h1></div>{email&&<span className="account">{email}</span>}</header>{msg&&<div className="notice">{msg}</div>}{body}<footer className="app-legal-footer"><div>Duo R&amp;M s. r. o. · IČO 53658132 · <a href="mailto:info@duoakva.sk">info@duoakva.sk</a></div><div><a href="/prevadzkovatel">Prevádzkovateľ</a><a href="/ochrana-osobnych-udajov">Ochrana osobných údajov</a><a href="/cookies">Cookies</a><a href="/podmienky-pouzivania">Podmienky používania</a></div></footer></main><FeedbackBubble userId={userId} email={email} page={page}/></div>
}
