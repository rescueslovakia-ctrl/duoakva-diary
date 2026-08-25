#!/usr/bin/env python3
import csv
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'

errors=[]
warnings=[]
ALLOWED_STATUS={'verified','verified_label_override','partial','review_required','unverified','secondary_consensus','conflicting_observation'}

def rows(name):
    with (DATA/name).open(encoding='utf-8',newline='') as f:return list(csv.DictReader(f))

def num(v):
    if v is None or str(v).strip()=='':return None
    try:return float(v)
    except:return 'INVALID'

def check_range(row,a,b,label,key):
    lo,hi=num(row.get(a)),num(row.get(b))
    if lo=='INVALID' or hi=='INVALID': errors.append(f'{key}: invalid numeric {label}')
    elif lo is not None and hi is not None and lo>hi: errors.append(f'{key}: {label} min > max')

for filename,keycols in [('plants.csv',('scientific_name','variant')),('livestock.csv',('scientific_name','variant')),('fertilizers.csv',('manufacturer','product_name','product_variant')),('equipment.csv',('category','manufacturer','model','variant'))]:
    data=rows(filename); keys=[]
    for i,r in enumerate(data,2):
        key=' | '.join((r.get(c) or '').strip().lower() for c in keycols);keys.append(key)
        status=(r.get('verification_status') or '').strip()
        if status not in ALLOWED_STATUS: errors.append(f'{filename}:{i}: unsupported verification_status={status!r}')
        if status in {'verified','verified_label_override'} and not (r.get('source_url') or '').strip(): errors.append(f'{filename}:{i}: verified row without source_url')
        if filename in ('plants.csv','livestock.csv'):
            for a,b,label in [('temperature_min','temperature_max','temperature'),('ph_min','ph_max','pH'),('gh_min','gh_max','GH'),('kh_min','kh_max','KH')]:check_range(r,a,b,label,f'{filename}:{i}')
        if filename=='livestock.csv':
            for c in ('adult_size_cm','min_tank_l','min_group_size','recommended_group_size'):
                x=num(r.get(c));
                if x=='INVALID':errors.append(f'{filename}:{i}: invalid {c}')
                elif x is not None and x<=0:errors.append(f'{filename}:{i}: non-positive {c}')
        if filename=='equipment.csv':
            for c in ('power_w','flow_l_h','volume_min_l','volume_max_l'):
                x=num(r.get(c));
                if x=='INVALID':errors.append(f'{filename}:{i}: invalid {c}')
                elif x is not None and x<0:errors.append(f'{filename}:{i}: negative {c}')
    for k,n in Counter(keys).items():
        if k and n>1:errors.append(f'{filename}: duplicate key {k!r} ({n}x)')

fert={(r.get('manufacturer','').strip().lower(),r.get('product_name','').strip().lower()):r for r in rows('fertilizers.csv')}
nutrients=rows('fertilizer_nutrients.csv');verified_nutrients=Counter()
for i,r in enumerate(nutrients,2):
    key=(r.get('manufacturer','').strip().lower(),r.get('product_name','').strip().lower())
    if key not in fert:errors.append(f'fertilizer_nutrients.csv:{i}: unknown fertilizer {key}')
    status=(r.get('verification_status') or '').strip()
    if status not in ALLOWED_STATUS:errors.append(f'fertilizer_nutrients.csv:{i}: unsupported status {status!r}')
    if status in {'verified','verified_label_override'}:
        verified_nutrients[key]+=1
        if not (r.get('source_url') or '').strip():errors.append(f'fertilizer_nutrients.csv:{i}: verified nutrient without source')
    for c in ('concentration_mg_l','dose_ml','reference_volume_l','resulting_increase_mg_l'):
        x=num(r.get(c));
        if x=='INVALID':errors.append(f'fertilizer_nutrients.csv:{i}: invalid {c}')
        elif x is not None and x<0:errors.append(f'fertilizer_nutrients.csv:{i}: negative {c}')

for key,r in fert.items():
    if (r.get('calculation_safe') or '').strip().lower() in ('true','1','yes') and verified_nutrients[key]==0:errors.append(f'fertilizers.csv: calculation_safe without verified nutrient evidence: {key}')

print(f'Errors: {len(errors)}')
for e in errors:print('ERROR:',e)
print(f'Warnings: {len(warnings)}')
for w in warnings:print('WARN:',w)
print('Counts:',{n:len(rows(n)) for n in ['plants.csv','livestock.csv','fertilizers.csv','fertilizer_nutrients.csv','equipment.csv','aliases.csv']})
raise SystemExit(1 if errors else 0)
