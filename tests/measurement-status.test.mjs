import test from 'node:test';
import assert from 'node:assert/strict';
import {measurementStatus,measurementStatusLabel} from '../lib/measurementStatus.ts';

test('toxic nitrogen ignores custom targets',()=>{
  assert.equal(measurementStatus('no2',0,{min:0,max:1,source:'user_custom'}),'good');
  assert.equal(measurementStatus('no2',0.4,{min:0,max:1,source:'user_custom'}),'bad');
  assert.equal(measurementStatus('nh3',0.03,{min:0,max:1,source:'user_custom'}),'bad');
});

test('custom pH range overrides generic range and labels source',()=>{
  const target={min:5,max:5.5,source:'user_custom'};
  assert.equal(measurementStatus('ph',5.25,target),'good');
  assert.equal(measurementStatus('ph',6.5,target),'bad');
  assert.equal(measurementStatusLabel('bad',target),'Mimo používateľom nastaveného rozsahu');
});

test('controller source has distinct status label',()=>{
  const target={min:6.4,max:6.6,source:'ph_controller'};
  assert.equal(measurementStatus('ph',6.5,target),'good');
  assert.equal(measurementStatusLabel('good',target),'V rozsahu nastavenia pH controlleru');
});
