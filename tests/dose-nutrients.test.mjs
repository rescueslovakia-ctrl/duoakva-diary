import assert from 'node:assert/strict';
import test from 'node:test';
import {doseNutrients,formatNutrients} from '../lib/doseNutrients.ts';
const nitro={fertilizer_catalog:{verification_status:'verified',reference_liters:100,reference_dose_ml:1,nutrient_effects:{no3:1.25,k:.8,__schedule:{verified:true}}}};
test('Nitro 2.8 ml in 180 l includes both NO3 and potassium',()=>{
 const result=doseNutrients(nitro,2.8,180);
 assert.ok(Math.abs(result.no3-1.9444444444)<1e-9);
 assert.ok(Math.abs(result.k-1.2444444444)<1e-9);
 assert.equal(Object.keys(result).length,2);
});
test('reference dose is part of nutrient conversion',()=>{
 const a={fertilizer_catalog:{verification_status:'verified',reference_liters:100,reference_dose_ml:5,nutrient_effects:{fe:.1}}};
 assert.equal(doseNutrients(a,5,200).fe,.05);
});
test('confirmed user label overrides catalog and unknown content remains unknown',()=>{
 const a={...nitro,custom_nutrient_effects:{user_confirmed:true,reference_liters:100,reference_dose_ml:1,effects:{no3:2}}};
 assert.equal(doseNutrients(a,1,100).no3,2);
 assert.equal(doseNutrients({...nitro,fertilizer_catalog:{...nitro.fertilizer_catalog,verification_status:'pending'}},1,100),null);
 assert.equal(doseNutrients(nitro,1,0),null);
 assert.equal(doseNutrients(nitro,NaN,180),null);
 assert.equal(doseNutrients({custom_nutrient_effects:{user_confirmed:true}},1,100),null);
 assert.match(formatNutrients(null),/nie je overený/);
});
