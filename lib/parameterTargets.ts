import type {TargetRange} from "@/lib/measurementStatus";

export const PROTECTED_PARAMETER_CODES=new Set(["no2","nh3","nh4"]);
export const ABSOLUTE_PARAMETER_BOUNDS:Record<string,{min:number;max:number}>={ph:{min:0,max:14},gh:{min:0,max:60},kh:{min:0,max:40},no3:{min:0,max:500},po4:{min:0,max:50},k:{min:0,max:200},fe:{min:0,max:10},mg:{min:0,max:200},ca:{min:0,max:500},co2:{min:0,max:100},temperature:{min:0,max:45},tds:{min:0,max:3000},ec:{min:0,max:6000},o2:{min:0,max:30}};

export function isPhControllerEquipment(x:any){const text=`${x?.manufacturer||''} ${x?.model||''} ${x?.notes||''}`.toLowerCase();return((x?.category==='controller'&&/(ph|co2|co₂)/i.test(text))||(x?.category==='co2'&&/(controller|control|ph)/i.test(text)))&&Number.isFinite(Number(x?.settings?.ph_setpoint))}
function mergedSpecies(row:any){const c=row?.livestock_catalog||{},d=row?.discovery_data||{};return{temperature_min:c.temperature_min??d.temperature_min,temperature_max:c.temperature_max??d.temperature_max,ph_min:c.ph_min??d.ph_min,ph_max:c.ph_max??d.ph_max,gh_min:c.gh_min??d.gh_min,gh_max:c.gh_max??d.gh_max,kh_min:c.kh_min??d.kh_min,kh_max:c.kh_max??d.kh_max}}
export function sharedLivestockTargets(rows:any[]){const out:Record<string,TargetRange>={};for(const code of ['temperature','ph','gh','kh']){const mins:number[]=[],maxs:number[]=[];for(const row of rows){const s:any=mergedSpecies(row);if(typeof s[`${code}_min`]==='number')mins.push(s[`${code}_min`]);if(typeof s[`${code}_max`]==='number')maxs.push(s[`${code}_max`])}if(mins.length&&maxs.length){const min=Math.max(...mins),max=Math.min(...maxs);if(min<=max)out[code]={min,max,source:'livestock'}}}return out}

export function buildEffectiveTargets({systemRows=[],livestockRows=[],equipmentRows=[],userRows=[]}:{systemRows?:any[];livestockRows?:any[];equipmentRows?:any[];userRows?:any[]}){
 const out:Record<string,TargetRange>={};
 for(const x of systemRows){if(PROTECTED_PARAMETER_CODES.has(x.parameter_code))continue;const r:TargetRange={};if(x.min_value!=null)r.min=Number(x.min_value);if(x.max_value!=null)r.max=Number(x.max_value);if(r.min!=null||r.max!=null)out[x.parameter_code]=r}
 Object.assign(out,sharedLivestockTargets(livestockRows));
 const controller=equipmentRows.find(isPhControllerEquipment);if(controller){const p=Number(controller.settings.ph_setpoint);out.ph={min:p-.1,max:p+.1,source:'ph_controller'}}
 for(const x of userRows){if(PROTECTED_PARAMETER_CODES.has(x.parameter_code))continue;const r:TargetRange={source:'user_custom'};if(x.min_value!=null)r.min=Number(x.min_value);if(x.max_value!=null)r.max=Number(x.max_value);if(r.min!=null||r.max!=null)out[x.parameter_code]=r}
 return out;
}

export function visualStatusForTarget(code:string,value:number,status:string,target?:TargetRange|null){if(target?.source==='user_custom'&&target.min!=null&&value<target.min)return'low';if(code==='po4'&&value<0.2&&status!=='good')return'low';return status}
