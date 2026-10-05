export type NutrientAssignment = {
 custom_nutrient_effects?: any;
 fertilizer_catalog?: {verification_status?: string | null; reference_liters?: number | null; reference_dose_ml?: number | null; nutrient_effects?: any} | null;
};
export const nutrientLabels: Record<string,string> = {no3:'NO₃',po4:'PO₄',k:'K',fe:'Fe',mg:'Mg',ca:'Ca'};
export function doseNutrients(a: NutrientAssignment | undefined, ml: number, liters: number): Record<string,number> | null {
 const custom=a?.custom_nutrient_effects;
 const c=a?.fertilizer_catalog;
 const d=custom?.user_confirmed===true ? {effects:custom.effects,refL:Number(custom.reference_liters),refDose:Number(custom.reference_dose_ml)} : c?.verification_status==='verified' ? {effects:c.nutrient_effects,refL:Number(c.reference_liters),refDose:Number(c.reference_dose_ml)} : null;
 if(!d || !Number.isFinite(ml) || ml<=0 || !Number.isFinite(liters) || liters<=0 || !Number.isFinite(d.refL) || d.refL<=0 || !Number.isFinite(d.refDose) || d.refDose<=0)return null;
 const result:Record<string,number>={};
 for(const code of Object.keys(nutrientLabels)){
  const effect=Number(d.effects?.[code]);
  if(Number.isFinite(effect)&&effect>0)result[code]=effect*(d.refL/liters)*(ml/d.refDose);
 }
 return Object.keys(result).length ? result : null;
}
export function formatNutrients(values: Record<string,number> | null | undefined): string {
 if(!values || !Object.keys(values).length)return 'Obsah živín nie je overený – prírastok nemožno vypočítať.';
 return Object.entries(values).filter(([code,value])=>nutrientLabels[code]&&Number.isFinite(Number(value))).map(([code,value])=>`+${Number(value).toLocaleString('sk-SK',{maximumFractionDigits:4})} mg/l ${nutrientLabels[code]}`).join(' · ');
}
