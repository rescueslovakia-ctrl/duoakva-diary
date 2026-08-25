export type VerifiedSchedule={
 verified:true;
 mode:'regular'|'correction'|'both';
 frequency_kind:'daily'|'per_week'|'as_needed';
 times_per_week_min?:number|null;
 times_per_week_max?:number|null;
 as_needed?:boolean;
 source_text?:string|null;
 source_url?:string|null;
 verified_at?:string|null;
 verified_by?:string|null;
 variants?:{
  no_co2_dose_ml?:number|null;
  co2_low_light_dose_ml?:number|null;
  co2_high_light_dose_ml?:number|null;
 }|null;
};

export function getVerifiedSchedule(effects:any):VerifiedSchedule|null{
 const s=effects?.__schedule;
 if(!s||s.verified!==true)return null;
 if(!['regular','correction','both'].includes(s.mode))return null;
 if(!['daily','per_week','as_needed'].includes(s.frequency_kind))return null;
 return s as VerifiedSchedule;
}

export function scheduleDoseMl(args:{effects:any;referenceDoseMl:number;referenceLiters:number;liters:number;hasCo2:boolean;highLight:boolean}){
 const s=getVerifiedSchedule(args.effects);
 if(!s||!['regular','both'].includes(s.mode)||args.referenceDoseMl<=0||args.referenceLiters<=0||args.liters<=0)return null;
 let refDose=args.referenceDoseMl;
 const v=s.variants||{};
 if(args.hasCo2&&args.highLight&&Number(v.co2_high_light_dose_ml)>0)refDose=Number(v.co2_high_light_dose_ml);
 else if(args.hasCo2&&Number(v.co2_low_light_dose_ml)>0)refDose=Number(v.co2_low_light_dose_ml);
 else if(!args.hasCo2&&Number(v.no_co2_dose_ml)>0)refDose=Number(v.no_co2_dose_ml);
 const ml=refDose*args.liters/args.referenceLiters;
 let frequency='';
 if(s.frequency_kind==='daily')frequency='denne';
 else if(s.frequency_kind==='as_needed')frequency='podľa potreby';
 else{
  const min=Number(s.times_per_week_min||0),max=Number(s.times_per_week_max||0);
  if(min>0&&max>0)frequency=min===max?`${min}× týždenne`:`${min}–${max}× týždenne`;
  else return null;
  if(s.as_needed)frequency+=' alebo podľa potreby';
 }
 return{ml,frequency,schedule:s};
}
