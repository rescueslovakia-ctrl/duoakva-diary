export type MeasurementStatus='good'|'warning'|'bad'|'neutral';
export type TargetRange={min?:number;max?:number};
type Range={goodMin?:number;goodMax?:number;warnMin?:number;warnMax?:number;exactZero?:boolean};

const fallback:Record<string,Range>={
 ph:{goodMin:6.2,goodMax:7.8,warnMin:5.8,warnMax:8.2},
 gh:{goodMin:4,goodMax:15,warnMin:2,warnMax:20},
 kh:{goodMin:2,goodMax:10,warnMin:1,warnMax:14},
 no2:{exactZero:true,warnMax:0.1},
 nh3:{exactZero:true,warnMax:0.02},
 nh4:{exactZero:true,warnMax:0.1},
 no3:{goodMin:5,goodMax:25,warnMin:0,warnMax:40},
 po4:{goodMin:0.2,goodMax:1.5,warnMin:0,warnMax:2.5},
 fe:{goodMin:0.02,goodMax:0.2,warnMin:0,warnMax:0.5},
 k:{goodMin:5,goodMax:20,warnMin:0,warnMax:30},
 mg:{goodMin:3,goodMax:15,warnMin:0,warnMax:25},
 ca:{goodMin:15,goodMax:60,warnMin:5,warnMax:100},
 temperature:{goodMin:22,goodMax:27,warnMin:18,warnMax:30},
 o2:{goodMin:6,goodMax:20,warnMin:4,warnMax:30},
 tds:{goodMin:80,goodMax:350,warnMin:40,warnMax:500},
 ec:{goodMin:120,goodMax:700,warnMin:60,warnMax:1000}
};

function statusFromRange(value:number,r:Range):MeasurementStatus{
 if(r.exactZero){if(value===0)return 'good';if(r.warnMax!=null&&value<=r.warnMax)return 'warning';return 'bad'}
 const inGood=(r.goodMin==null||value>=r.goodMin)&&(r.goodMax==null||value<=r.goodMax);if(inGood)return 'good';
 const inWarn=(r.warnMin==null||value>=r.warnMin)&&(r.warnMax==null||value<=r.warnMax);return inWarn?'warning':'bad';
}

export function measurementStatus(code:string,value:number,target?:TargetRange|null):MeasurementStatus{
 if(!Number.isFinite(value))return 'neutral';
 // Toxic nitrogen parameters must stay governed by safety limits, never by livestock preference ranges.
 if(['no2','nh3','nh4'].includes(code))return statusFromRange(value,fallback[code]);
 if(target&&(target.min!=null||target.max!=null)){
  const min=target.min,max=target.max;
  const inTarget=(min==null||value>=min)&&(max==null||value<=max);if(inTarget)return 'good';
  const span=min!=null&&max!=null?Math.max(.1,max-min):undefined;
  const pad=span!=null?Math.max(span*.2,code==='ph'?.2:1):code==='ph'?.3:2;
  const warnMin=min==null?undefined:min-pad,warnMax=max==null?undefined:max+pad;
  const inWarn=(warnMin==null||value>=warnMin)&&(warnMax==null||value<=warnMax);return inWarn?'warning':'bad';
 }
 const r=fallback[code];return r?statusFromRange(value,r):'neutral';
}

export function measurementStatusLabel(status:MeasurementStatus,target?:TargetRange|null){
 if(status==='good')return target?'V rozsahu vhodnom pre osádku':'V odporúčanom rozsahu';
 if(status==='warning')return target?'Tesne mimo rozsahu osádky':'Hraničná hodnota';
 if(status==='bad')return target?'Mimo rozsahu vhodného pre osádku':'Mimo odporúčaného rozsahu';
 return 'Bez univerzálneho rozsahu';
}
