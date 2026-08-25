import "server-only";
import fs from "node:fs";
import path from "node:path";
import {createClient} from "@supabase/supabase-js";

type Row=Record<string,string>;

function adminClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error("missing_supabase_server_config");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
function read(name:string){return fs.readFileSync(path.join(process.cwd(),"catalog-data",name),"utf8")}
function csv(text:string):Row[]{
 const matrix:string[][]=[];let row:string[]=[],field="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=""}else if(c==='\n'){row.push(field.replace(/\r$/,""));matrix.push(row);row=[];field=""}else field+=c}
 if(field.length||row.length){row.push(field.replace(/\r$/,""));matrix.push(row)}
 const h=matrix.shift()||[];return matrix.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??""])));
}
const n=(v:string)=>v.trim()===""?null:Number(v);
const b=(v:string)=>["true","1","yes"].includes(v.trim().toLowerCase());
const clean=(v?:string)=>v?.trim()||null;
function batches<T>(a:T[],size=80){const out:T[][]=[];for(let i=0;i<a.length;i+=size)out.push(a.slice(i,i+size));return out}
async function insertBatches(table:string,rows:any[]){const s=adminClient();let added=0;for(const batch of batches(rows)){if(!batch.length)continue;const{error}=await s.from(table).insert(batch);if(error)throw new Error(`${table}: ${error.message}`);added+=batch.length}return added}
function plantDisplay(scientific:string,variant:string){const s=scientific.trim(),v=variant.trim();return v?`${s} ${v}`:s}

async function bootstrapPlants(){
 const s=adminClient();const verified=csv(read("plants.csv"));const candidates=read("plant_candidates.txt").split(/\r?\n/).filter(Boolean).map(line=>{const[a,b]=line.split("|");return{scientific_name:a||"",variant:b||""}});
 const{data,error}=await s.from("plant_catalog").select("scientific_name");if(error)throw error;const have=new Set((data||[]).map((x:any)=>String(x.scientific_name||"").trim().toLowerCase()));const rows:any[]=[];
 for(const r of verified){const scientific_name=plantDisplay(r.scientific_name,r.variant||"");const key=scientific_name.toLowerCase();if(!scientific_name||have.has(key))continue;rows.push({scientific_name,common_name:clean(r.common_name),difficulty:clean(r.difficulty)?.toLowerCase(),light_requirement:clean(r.light_requirement)?.toLowerCase(),co2_requirement:clean(r.co2_requirement)?.toLowerCase(),growth_rate:clean(r.growth_rate)?.toLowerCase(),placement:clean(r.placement),temperature_min:n(r.temperature_min),temperature_max:n(r.temperature_max),ph_min:n(r.ph_min),ph_max:n(r.ph_max),gh_min:n(r.gh_min),gh_max:n(r.gh_max),kh_min:n(r.kh_min),kh_max:n(r.kh_max),notes:clean(r.notes)});have.add(key)}
 for(const r of candidates){const scientific_name=plantDisplay(r.scientific_name,r.variant);const key=scientific_name.toLowerCase();if(!scientific_name||have.has(key))continue;rows.push({scientific_name,common_name:null,notes:"Katalógová položka. Detailné nároky zatiaľ nie sú overené."});have.add(key)}
 const added=await insertBatches("plant_catalog",rows);return{added,total:have.size};
}

async function bootstrapLivestock(){
 const s=adminClient();const verified=csv(read("livestock.csv"));const candidates=read("livestock_candidates.txt").split(/\r?\n/).filter(Boolean).map(line=>{const[a,b,c]=line.split("|");return{scientific_name:a||"",common_name:b||"",category:c||"fish"}});
 const{data,error}=await s.from("livestock_catalog").select("scientific_name,variant");if(error)throw error;const keyOf=(a:string,v:string)=>`${a.trim().toLowerCase()}|${v.trim().toLowerCase()}`;const have=new Set((data||[]).map((x:any)=>keyOf(String(x.scientific_name||""),String(x.variant||""))));const rows:any[]=[];
 for(const r of verified){const variant=r.variant||"",key=keyOf(r.scientific_name,variant);if(!r.scientific_name||have.has(key))continue;rows.push({scientific_name:r.scientific_name,common_name:clean(r.common_name),category:r.category||"fish",variant,adult_size_cm:n(r.adult_size_cm),min_tank_l:n(r.min_tank_l),min_group_size:n(r.min_group_size),recommended_group_size:n(r.recommended_group_size),temperature_min:n(r.temperature_min),temperature_max:n(r.temperature_max),ph_min:n(r.ph_min),ph_max:n(r.ph_max),gh_min:n(r.gh_min),gh_max:n(r.gh_max),kh_min:n(r.kh_min),kh_max:n(r.kh_max),temperament:clean(r.temperament),swimming_zone:clean(r.swimming_zone),diet:clean(r.diet),difficulty:clean(r.difficulty),shrimp_safe:r.shrimp_safe?b(r.shrimp_safe):null,snail_safe:r.snail_safe?b(r.snail_safe):null,plant_safe:r.plant_safe?b(r.plant_safe):null,notes:clean(r.notes),source_name:clean(r.source_name),source_url:clean(r.source_url),verification_status:r.verification_status||"partial"});have.add(key)}
 for(const r of candidates){const key=keyOf(r.scientific_name,"");if(!r.scientific_name||have.has(key))continue;rows.push({scientific_name:r.scientific_name,common_name:clean(r.common_name),category:r.category||"fish",variant:"",notes:"Katalógová položka. Biologické rozsahy zatiaľ nie sú overené.",verification_status:"unverified"});have.add(key)}
 const added=await insertBatches("livestock_catalog",rows);return{added,total:have.size};
}

async function bootstrapEquipment(){
 const s=adminClient();const verified=csv(read("equipment.csv"));const candidates=read("equipment_candidates.txt").split(/\r?\n/).filter(Boolean).map(line=>{const[a,b,c]=line.split("|");return{category:a||"other",manufacturer:b||"",model:c||""}});const normCat=(c:string)=>c==="external_filter"?"filter":c;
 const{data,error}=await s.from("equipment_catalog").select("manufacturer_name,model,category");if(error)throw error;const keyOf=(m:string,model:string,c:string)=>`${m.trim().toLowerCase()}|${model.trim().toLowerCase()}|${normCat(c).toLowerCase()}`;const have=new Set((data||[]).map((x:any)=>keyOf(String(x.manufacturer_name||""),String(x.model||""),String(x.category||""))));const rows:any[]=[];
 for(const r of verified){const category=normCat(r.category),key=keyOf(r.manufacturer,r.model,category);if(!r.model||have.has(key))continue;const specs:any={};if(n(r.power_w)!=null)specs.power_w=n(r.power_w);if(n(r.flow_l_h)!=null)specs.nominal_flow_lph=n(r.flow_l_h);if(n(r.volume_min_l)!=null)specs.volume_min_l=n(r.volume_min_l);if(n(r.volume_max_l)!=null)specs.volume_max_l=n(r.volume_max_l);if(r.dimensions_mm)specs.dimensions_mm=r.dimensions_mm;if(r.connection_size)specs.connection_size=r.connection_size;if(r.feature_flags)specs.feature_flags=r.feature_flags.split(";").filter(Boolean);rows.push({manufacturer_name:r.manufacturer,model:r.model,category,specs,source_type:"verified_catalog",source_url:clean(r.source_url),verification_status:r.verification_status==="verified"?"verified":"pending"});have.add(key)}
 for(const r of candidates){const category=normCat(r.category),key=keyOf(r.manufacturer,r.model,category);if(!r.model||have.has(key))continue;rows.push({manufacturer_name:r.manufacturer||null,model:r.model,category,specs:{},source_type:"catalog_candidate",verification_status:"unverified"});have.add(key)}
 const added=await insertBatches("equipment_catalog",rows);return{added,total:have.size};
}

async function bootstrapFertilizers(){
 const s=adminClient();const verified=csv(read("fertilizers.csv"));const nutrients=csv(read("fertilizer_nutrients.csv"));const candidates=read("fertilizer_candidates.txt").split(/\r?\n/).filter(Boolean).map(line=>{const[a,b,c]=line.split("|");return{manufacturer:a||"",product_name:b||"",category:c||""}});const keyOf=(m:string,p:string)=>`${m.trim().toLowerCase()}|${p.trim().toLowerCase()}`;
 const effectMap=new Map<string,Record<string,number>>();for(const r of nutrients){if(!["verified","verified_label_override"].includes(r.verification_status))continue;const code=r.nutrient_code.toLowerCase();if(!["no3","po4","k","fe","mg"].includes(code))continue;const value=n(r.resulting_increase_mg_l);if(value==null)continue;const key=keyOf(r.manufacturer,r.product_name),o=effectMap.get(key)||{};o[code]=value;effectMap.set(key,o)}
 const{data,error}=await s.from("fertilizer_catalog").select("manufacturer,product_name");if(error)throw error;const have=new Set((data||[]).map((x:any)=>keyOf(String(x.manufacturer||""),String(x.product_name||""))));const rows:any[]=[];
 for(const r of verified){const key=keyOf(r.manufacturer,r.product_name);if(!r.product_name||have.has(key))continue;const safe=b(r.calculation_safe),effects=safe?(effectMap.get(key)||{}):{};rows.push({manufacturer:r.manufacturer||null,product_name:r.product_name,reference_liters:Number(r.default_dose_volume_l||100),reference_dose_ml:Number(r.default_dose_ml||1),nutrient_effects:effects,declared_composition:{},description:clean(r.notes),dosing_instructions:`${r.default_dose_ml||"?"} ml / ${r.default_dose_volume_l||"?"} l · ${r.dose_frequency||"podľa potreby"}`,source_url:clean(r.source_url),verification_status:["verified","verified_label_override"].includes(r.verification_status)?"verified":"pending",enrichment_status:["verified","verified_label_override"].includes(r.verification_status)?"verified":"pending"});have.add(key)}
 for(const r of candidates){const key=keyOf(r.manufacturer,r.product_name);if(!r.product_name||have.has(key))continue;rows.push({manufacturer:r.manufacturer||null,product_name:r.product_name,reference_liters:100,reference_dose_ml:1,nutrient_effects:{},declared_composition:{},description:`Katalógová položka (${r.category}). Presné dávkovanie zatiaľ nie je overené.`,dosing_instructions:null,verification_status:"unverified",enrichment_status:"pending"});have.add(key)}
 const added=await insertBatches("fertilizer_catalog",rows);return{added,total:have.size};
}

export async function bootstrapCatalogs(){
 const results:any={};for(const[name,fn]of Object.entries({plants:bootstrapPlants,livestock:bootstrapLivestock,fertilizers:bootstrapFertilizers,equipment:bootstrapEquipment})){try{results[name]=await fn()}catch(e){results[name]={error:e instanceof Error?e.message:String(e)}}}return results;
}
