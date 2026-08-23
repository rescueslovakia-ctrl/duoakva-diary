"use client";
import {useEffect,useState} from "react";
import {Save,RotateCcw,User,SlidersHorizontal} from "lucide-react";

type Props={email:string};
type SettingsState={defaultWaterSource:'tap'|'ro'|'mixed';defaultGh:string;defaultKh:string;confirmDeletes:boolean;compactCards:boolean};
const defaults:SettingsState={defaultWaterSource:'tap',defaultGh:'6',defaultKh:'3',confirmDeletes:true,compactCards:false};
const KEY='duoakva-user-settings-v1';

export default function SettingsModule({email}:Props){
 const[state,setState]=useState<SettingsState>(defaults);const[saved,setSaved]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setState({...defaults,...JSON.parse(raw)})}catch{}},[]);
 function save(){localStorage.setItem(KEY,JSON.stringify(state));setSaved(true);setTimeout(()=>setSaved(false),1800)}
 function reset(){setState(defaults);localStorage.removeItem(KEY);setSaved(true);setTimeout(()=>setSaved(false),1800)}
 return <><section className="card"><h3><User size={18}/> Účet</h3><p><b>Prihlásený používateľ:</b> {email||'—'}</p><p className="muted">Účet a autentifikáciu spravuje Supabase. Tieto nastavenia sa zatiaľ ukladajú lokálne v tomto zariadení.</p></section><section className="card"><h3><SlidersHorizontal size={18}/> Predvolené hodnoty</h3><div className="grid3"><label>Predvolený zdroj vody<select value={state.defaultWaterSource} onChange={e=>setState({...state,defaultWaterSource:e.target.value as any})}><option value="tap">Vodovodná</option><option value="ro">Reverzná osmóza (RO)</option><option value="mixed">Mix RO + vodovodná</option></select></label><label>Predvolené cieľové GH<input type="number" step="0.1" min="0" value={state.defaultGh} onChange={e=>setState({...state,defaultGh:e.target.value})}/></label><label>Predvolené cieľové KH<input type="number" step="0.1" min="0" value={state.defaultKh} onChange={e=>setState({...state,defaultKh:e.target.value})}/></label></div><label style={{display:'block',marginTop:12}}><input type="checkbox" checked={state.confirmDeletes} onChange={e=>setState({...state,confirmDeletes:e.target.checked})}/> Potvrdzovať mazanie záznamov</label><label style={{display:'block',marginTop:8}}><input type="checkbox" checked={state.compactCards} onChange={e=>setState({...state,compactCards:e.target.checked})}/> Kompaktnejšie karty</label><div className="form-actions" style={{marginTop:16}}><button className="primary" onClick={save}><Save size={16}/> Uložiť nastavenia</button><button onClick={reset}><RotateCcw size={16}/> Obnoviť predvolené</button></div>{saved&&<div className="notice">✅ Nastavenia boli uložené.</div>}</section></>;
}
