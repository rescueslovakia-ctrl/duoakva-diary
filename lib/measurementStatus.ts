export type MeasurementStatus='good'|'warning'|'bad'|'neutral';

type Range={goodMin?:number;goodMax?:number;warnMin?:number;warnMax?:number;exactZero?:boolean};

// Fallback ranges for a typical freshwater aquarium. These are intentionally
// centralised so they can later be replaced/overridden by aquarium- or
// livestock-specific targets without changing every UI module.
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

export function measurementStatus(code:string,value:number):MeasurementStatus{
 const r=fallback[code];
 if(!r||!Number.isFinite(value))return 'neutral';
 if(r.exactZero){
  if(value===0)return 'good';
  if(r.warnMax!=null&&value<=r.warnMax)return 'warning';
  return 'bad';
 }
 const inGood=(r.goodMin==null||value>=r.goodMin)&&(r.goodMax==null||value<=r.goodMax);
 if(inGood)return 'good';
 const inWarn=(r.warnMin==null||value>=r.warnMin)&&(r.warnMax==null||value<=r.warnMax);
 return inWarn?'warning':'bad';
}

export function measurementStatusLabel(status:MeasurementStatus){
 if(status==='good')return 'V odporúčanom rozsahu';
 if(status==='warning')return 'Hraničná hodnota';
 if(status==='bad')return 'Mimo odporúčaného rozsahu';
 return 'Bez univerzálneho rozsahu';
}
